import "server-only";

import type { RowDataPacket } from "mysql2";
import { categoryOrder, products as starterProducts, type Category, type Product, type ProductOption, type Subcategory } from "../data/products";
import { getDatabase } from "./database";

type CatalogRow = RowDataPacket & { slug: string; data: string | object | null; is_deleted: number };
export type Catalog = { categories: Category[]; subcategories: Subcategory[]; products: Product[]; ready: boolean; subcategoriesReady: boolean };

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
  let subcategoryRows: CatalogRow[] = [];
  let subcategoriesReady = true;
  try {
    const [categories] = await getDatabase().execute<CatalogRow[]>("SELECT slug, data, is_deleted FROM catalog_categories");
    const [products] = await getDatabase().execute<CatalogRow[]>("SELECT slug, data, is_deleted FROM catalog_products");
    categoryRows = categories;
    productRows = products;
  } catch (error) {
    if (isMissingTable(error)) return {
      categories: categoryOrder,
      subcategories: [],
      products: starterProducts.map((product) => ({ ...product, shippingCents: categoryOrder.find((category) => category.slug === product.category)?.shippingCents ?? 0 })),
      ready: false,
      subcategoriesReady: false,
    };
    throw error;
  }

  try {
    const [subcategories] = await getDatabase().execute<CatalogRow[]>("SELECT slug, data, is_deleted FROM catalog_subcategories");
    subcategoryRows = subcategories;
  } catch (error) {
    if (isMissingTable(error)) subcategoriesReady = false;
    else throw error;
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

  const subcategories = new Map<string, Subcategory>();
  for (const row of subcategoryRows) {
    if (row.is_deleted) subcategories.delete(row.slug);
    else {
      const subcategory = objectValue<Subcategory>(row.data);
      if (subcategory && categories.has(subcategory.category)) subcategories.set(row.slug, subcategory);
    }
  }

  const currentCategories = [...categories.values()];
  const currentSubcategories = [...subcategories.values()];
  const currentProducts = [...products.values()].flatMap((product) => {
    const category = categories.get(product.category);
    if (!category) return [];
    const subcategory = product.subcategory ? subcategories.get(product.subcategory) : undefined;
    const validSubcategory = subcategory?.category === product.category ? subcategory : undefined;
    const inheritedPrice = product.priceSource === "subcategory" ? validSubcategory?.defaultPrice : undefined;
    return [{
      ...product,
      categoryLabel: category.name,
      shippingCents: category.shippingCents,
      ...(validSubcategory ? { subcategory: validSubcategory.slug, subcategoryLabel: validSubcategory.name } : { subcategory: undefined, subcategoryLabel: undefined }),
      price: inheritedPrice ?? product.price,
    }];
  });
  return { categories: currentCategories, subcategories: currentSubcategories, products: currentProducts, ready: true, subcategoriesReady };
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

export function parseSubcategoryForm(form: FormData, catalog: Catalog): Subcategory {
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const category = String(form.get("category") ?? "");
  if (!validSlug(slug)) throw new Error("Use a lowercase subcategory URL with hyphens.");
  if (!catalog.categories.some((item) => item.slug === category)) throw new Error("Choose a valid parent category.");
  const defaultPriceValue = String(form.get("defaultPrice") ?? "").trim();
  const defaultPriceCents = defaultPriceValue ? moneyCents(defaultPriceValue, "Shared price") : undefined;
  if (defaultPriceCents !== undefined && defaultPriceCents < 1) throw new Error("Shared price must be greater than zero when provided.");
  const description = String(form.get("description") ?? "").trim();
  if (description.length > 500) throw new Error("Description must contain at most 500 characters.");
  return {
    slug,
    category,
    name: required(String(form.get("name") ?? ""), "Subcategory name", 100),
    ...(description ? { description } : {}),
    ...(defaultPriceCents !== undefined ? { defaultPrice: defaultPriceCents / 100 } : {}),
  };
}

export function parseProductForm(form: FormData, catalog: Catalog, uploadedImage?: string): Product {
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const category = String(form.get("category") ?? "");
  const selectedCategory = catalog.categories.find((item) => item.slug === category);
  const subcategorySlug = String(form.get("subcategory") ?? "").trim();
  const selectedSubcategory = subcategorySlug ? catalog.subcategories.find((item) => item.slug === subcategorySlug && item.category === category) : undefined;
  if (!validSlug(slug)) throw new Error("Use a lowercase product slug with hyphens.");
  if (!selectedCategory) throw new Error("Choose a valid category.");
  if (subcategorySlug && !selectedSubcategory) throw new Error("Choose a subcategory that belongs to this category.");
  const sizes = lines(String(form.get("sizes") ?? ""), 30);
  const colors = lines(String(form.get("colors") ?? ""), 30);
  if (!sizes.length || !colors.length) throw new Error("Add at least one size/configuration and one color/finish.");
  const optionName = String(form.get("optionName") ?? "").trim();
  const optionValues = lines(String(form.get("optionValues") ?? ""), 20);
  if (Boolean(optionName) !== Boolean(optionValues.length)) throw new Error("Provide both a custom option name and its choices.");
  const customOptions: ProductOption[] = optionName
    ? [{ name: required(optionName, "Custom option name", 60), values: optionValues }]
    : [];
  const priceSource = String(form.get("priceSource") ?? "product") === "subcategory" ? "subcategory" : "product";
  if (priceSource === "subcategory" && !selectedSubcategory?.defaultPrice) throw new Error("This subcategory does not have a shared price. Enter a product price instead.");
  const enteredPrice = String(form.get("price") ?? "").trim();
  const priceCents = priceSource === "subcategory"
    ? Math.round((selectedSubcategory?.defaultPrice ?? 0) * 100)
    : moneyCents(enteredPrice, "Price");
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
    ...(selectedSubcategory ? { subcategory: selectedSubcategory.slug, subcategoryLabel: selectedSubcategory.name } : {}),
    priceSource,
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

export async function saveSubcategory(subcategory: Subcategory, mode: "create" | "edit") {
  const catalog = await getCatalog();
  if (!catalog.subcategoriesReady) throw new Error("Subcategory storage is not installed. Run the subcategory migration first.");
  const existing = catalog.subcategories.find((entry) => entry.slug === subcategory.slug);
  if (mode === "create" && existing) throw new Error("That subcategory URL already exists.");
  if (mode === "edit" && !existing) throw new Error("Subcategory not found.");
  if (mode === "edit" && existing?.category !== subcategory.category) throw new Error("A subcategory cannot be moved to another category.");
  if (!subcategory.defaultPrice && catalog.products.some((product) => product.subcategory === subcategory.slug && product.priceSource === "subcategory")) {
    throw new Error("Set those products to their own price before removing this shared price.");
  }
  await getDatabase().execute(
    "INSERT INTO catalog_subcategories (slug, data, is_deleted) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE data = VALUES(data), is_deleted = 0",
    [subcategory.slug, JSON.stringify(subcategory)],
  );
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

export async function archiveCatalogEntry(type: "products" | "categories" | "subcategories", slug: string) {
  const catalog = await getCatalog();
  if (!catalog.ready) throw new Error("Catalog tables are not installed. Run the catalog migration first.");
  if (type === "categories" && catalog.products.some((product) => product.category === slug)) {
    throw new Error("Move or archive the products in this category first.");
  }
  if (type === "categories" && catalog.subcategories.some((subcategory) => subcategory.category === slug)) {
    throw new Error("Delete this category's subcategories first.");
  }
  if (type === "subcategories" && catalog.products.some((product) => product.subcategory === slug)) {
    throw new Error("Move or delete the products in this subcategory first.");
  }
  const exists = type === "products"
    ? catalog.products.some((product) => product.slug === slug)
    : type === "categories"
      ? catalog.categories.some((category) => category.slug === slug)
      : catalog.subcategories.some((subcategory) => subcategory.slug === slug);
  if (!exists) throw new Error("Catalog entry not found.");
  const table = type === "products" ? "catalog_products" : type === "categories" ? "catalog_categories" : "catalog_subcategories";
  await getDatabase().execute(
    `INSERT INTO ${table} (slug, data, is_deleted) VALUES (?, NULL, 1) ON DUPLICATE KEY UPDATE data = NULL, is_deleted = 1`,
    [slug],
  );
}
