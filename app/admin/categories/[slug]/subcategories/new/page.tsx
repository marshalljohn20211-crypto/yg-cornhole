import { notFound, redirect } from "next/navigation";
import CatalogShell from "../../../../catalog-shell";
import { SubcategoryForm } from "../../../../catalog-forms";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { getCatalog } from "../../../../../lib/catalog";

export default async function NewSubcategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const { error } = await searchParams;
  return (
    <CatalogShell section="categories" title={`New ${category.name} subcategory`} intro="This is optional. It creates another way to organize products inside the category." ready={catalog.ready} error={error}>
      {catalog.subcategoriesReady ? <SubcategoryForm category={category} /> : <p className="admin-notice is-error">Run <code>db/migrations/2026-10-07-catalog-subcategories.sql</code> first.</p>}
    </CatalogShell>
  );
}
