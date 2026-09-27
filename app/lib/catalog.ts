import "server-only";

import type { RowDataPacket } from "mysql2";
import { categoryOrder, products as starterProducts, type Category, type Product, type ProductOption } from "../data/products";
import { getDatabase } from "./database";

type CatalogRow = RowDataPacket & { slug: string; data: string | object | null; is_deleted: number };
export type Catalog = { categories: Category[]; products: Product[]; ready: boolean };

function isMissingTable(error: unknown) {
  return Boolean(error && typeof error === "object" && (
    ("code" in error && error.code === "ER_NO_SUCH_TABLE")
    || (error instanceof Error && error.message === "MySQL order storage is not configured.")
  ));
}

function objectValue<T>(value: string | object | null): T | null {
  if (!value) return null;
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

export async function getCatalog(): Promise<Catalog> {
  let categoryRows: CatalogRow[];
  let productRows: CatalogRow[];
  try {
    const [categories] = await getDatabase().execute<CatalogRow[]>("SELECT slug, data, is_deleted FROM catalog_categories");
    const [products] = await getDatabase().execute<CatalogRow[]>("SELECT slug, data, is_deleted FROM catalog_products");
    categoryRows = categories;
    productRows = products;
  } catch (error) {
    if (isMissingTable(error)) return {
      categories: categoryOrder,
      products: starterProducts.map((product) => ({ ...product, shippingCents: categoryOrder.find((category) => category.slug === product.category)?.shippingCents ?? 0 })),
      ready: false,
    };
    throw error;
  }

  const categories = new Map(categoryOrder.map((category) => [category.slug, category]));
  for (const row of categoryRows) {
    if (row.is_deleted) categories.delete(row.slug);
    else {
      const category = objectValue<Category>(row.data);
      if (category) categories.set(row.slug, category);
    }
  }

  const products = new Map(starterProducts.map((product) => [product.slug, product]));
  for (const row of productRows) {
    if (row.is_deleted) products.delete(row.slug);
    else {
      const product = objectValue<Product>(row.data);
      if (product) products.set(row.slug, product);
    }
  }

  const currentCategories = [...categories.values()];
  const currentProducts = [...products.values()].flatMap((product) => {
    const category = categories.get(product.category);
    return category ? [{ ...product, categoryLabel: category.name, shippingCents: category.shippingCents }] : [];
  });
  return { categories: currentCategories, products: currentProducts, ready: true };
}

function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 120;
}

function required(value: string, name: string, max: number) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new Error(`${name} must contain 1–${max} characters.`);
  return trimmed;
}

function moneyCents(value: string, name: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) throw new Error(`${name} must be a non-negative dollar amount.`);
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents > 10_000_000) throw new Error(`${name} is too large.`);
  return cents;
}

function lines(value: string, max: number) {
  const entries = value.split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean);
  if (entries.length > max || entries.some((entry) => entry.length > 100)) throw new Error(`Use at most ${max} short entries.`);
  return [...new Set(entries)];
}

function imagePath(value: string) {
  const image = value.trim();
  if (!/^\/images\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp|avif)$/.test(image)
      && !/^\/api\/catalog\/media\/[0-9a-f-]{36}$/.test(image)) {
    throw new Error("Use an existing /images/ path or upload a JPG, PNG, WebP, or AVIF image.");
  }
  return image;
}

export function parseCategoryForm(form: FormData): Category {
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  if (!validSlug(slug) || slug.length > 80) throw new Error("Use a lowercase category slug with hyphens.");
  return {
    slug,
    name: required(String(form.get("name") ?? ""), "Category name", 100),
    description: required(String(form.get("description") ?? ""), "Description", 500),
    shippingCents: moneyCents(String(form.get("shipping") ?? "0"), "Shipping"),
  };
}

export function parseProductForm(form: FormData, catalog: Catalog, uploadedImage?: string): Product {
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const category = String(form.get("category") ?? "");
  const selectedCategory = catalog.categories.find((item) => item.slug === category);
  if (!validSlug(slug)) throw new Error("Use a lowercase product slug with hyphens.");
  if (!selectedCategory) throw new Error("Choose a valid category.");
  const sizes = lines(String(form.get("sizes") ?? ""), 30);
  const colors = lines(String(form.get("colors") ?? ""), 30);
  if (!sizes.length || !colors.length) throw new Error("Add at least one size/configuration and one color/finish.");
  const optionName = String(form.get("optionName") ?? "").trim();
  const optionValues = lines(String(form.get("optionValues") ?? ""), 20);
  if (Boolean(optionName) !== Boolean(optionValues.length)) throw new Error("Provide both a custom option name and its choices.");
  const customOptions: ProductOption[] = optionName
    ? [{ name: required(optionName, "Custom option name", 60), values: optionValues }]
    : [];
  const priceCents = moneyCents(String(form.get("price") ?? ""), "Price");
  if (priceCents < 1) throw new Error("Product price must be greater than zero.");
  const speedFastValue = String(form.get("speedFast") ?? "").trim();
  const speedControlValue = String(form.get("speedControl") ?? "").trim();
  const speedFast = speedFastValue ? Number(speedFastValue) : undefined;
  const speedControl = speedControlValue ? Number(speedControlValue) : undefined;
  if ([speedFast, speedControl].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 10))) {
    throw new Error("Bag speed values must be between 0 and 10.");
  }
  const name = required(String(form.get("name") ?? ""), "Product name", 120);
  const eyebrow = String(form.get("eyebrow") ?? "").trim() || selectedCategory.name;
  const alt = String(form.get("alt") ?? "").trim() || `${name} product photo`;
  return {
    slug,
    name,
    category,
    categoryLabel: selectedCategory.name,
    price: priceCents / 100,
    image: imagePath(uploadedImage ?? String(form.get("image") ?? "")),
    alt: required(alt, "Image description", 180),
    eyebrow: required(eyebrow, "Short label", 80),
    description: required(String(form.get("description") ?? ""), "Description", 2000),
    features: lines(String(form.get("features") ?? ""), 30),
    colors,
    sizes,
    ...(String(form.get("badge") ?? "").trim() ? { badge: required(String(form.get("badge")), "Badge", 40) } : {}),
    ...(speedFast !== undefined ? { speedFast } : {}),
    ...(speedControl !== undefined ? { speedControl } : {}),
    ...(customOptions.length ? { customOptions } : {}),
  };
}

export async function saveCategory(category: Category, mode: "create" | "edit") {
  const catalog = await getCatalog();
  if (!catalog.ready) throw new Error("Catalog tables are not installed. Run the catalog migration first.");
  const exists = catalog.categories.some((entry) => entry.slug === category.slug);
  if (mode === "create" && exists) throw new Error("That category slug already exists.");
  if (mode === "edit" && !exists) throw new Error("Category not found.");
  await getDatabase().execute(
    "INSERT INTO catalog_categories (slug, data, is_deleted) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0",
    [category.slug, JSON.stringify(category)],
  );
}

export async function saveProduct(product: Product, mode: "create" | "edit") {
  const catalog = await getCatalog();
  if (!catalog.ready) throw new Error("Catalog tables are not installed. Run the catalog migration first.");
  const exists = catalog.products.some((entry) => entry.slug === product.slug);
  if (mode === "create" && exists) throw new Error("That product slug already exists.");
  if (mode === "edit" && !exists) throw new Error("Product not found.");
  await getDatabase().execute(
    "INSERT INTO catalog_products (slug, data, is_deleted) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0",
    [product.slug, JSON.stringify(product)],
  );
}

export async function archiveCatalogEntry(type: "products" | "categories", slug: string) {
  const catalog = await getCatalog();
  if (!catalog.ready) throw new Error("Catalog tables are not installed. Run the catalog migration first.");
  if (type === "categories" && catalog.products.some((product) => product.category === slug)) {
    throw new Error("Move or archive the products in this category first.");
  }
  const exists = type === "products"
    ? catalog.products.some((product) => product.slug === slug)
    : catalog.categories.some((category) => category.slug === slug);
  if (!exists) throw new Error("Catalog entry not found.");
  const table = type === "products" ? "catalog_products" : "catalog_categories";
  await getDatabase().execute(
    `INSERT INTO ${table} (slug, data, is_deleted) VALUES (?, NULL, 1) ON DUPLICATE KEY UPDATE data = NULL, is_deleted = 1`,
    [slug],
  );
}
