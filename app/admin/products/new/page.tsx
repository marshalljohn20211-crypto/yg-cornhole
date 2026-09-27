import { redirect } from "next/navigation";
import CatalogShell from "../../catalog-shell";
import { ProductForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const catalog = await getCatalog();
  const { error } = await searchParams;
  return <CatalogShell section="products" title="New product" intro="Choose a category and the form will guide you through the details customers need." ready={catalog.ready} error={error}>{catalog.ready ? <ProductForm categories={catalog.categories} /> : null}</CatalogShell>;
}
