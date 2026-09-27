import { redirect } from "next/navigation";
import CatalogShell from "../../catalog-shell";
import { CategoryForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const catalog = await getCatalog();
  const { error } = await searchParams;
  return <CatalogShell section="categories" title="New category" intro="Add a category without changing existing orders or product URLs." ready={catalog.ready} error={error}>{catalog.ready ? <CategoryForm /> : null}</CatalogShell>;
}
