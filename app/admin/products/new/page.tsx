import { redirect } from "next/navigation";
import CatalogShell from "../../catalog-shell";
import { ProductForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string; category?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const catalog = await getCatalog();
  const { error, category } = await searchParams;
  return <CatalogShell section="products" title="New product" intro="Choose a category, optionally choose a subcategory, and add the details customers need." ready={catalog.ready} error={error}>{catalog.ready ? <ProductForm categories={catalog.categories} subcategories={catalog.subcategories} initialCategorySlug={category} /> : null}</CatalogShell>;
}
