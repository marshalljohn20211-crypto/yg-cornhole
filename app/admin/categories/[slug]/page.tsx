import { notFound, redirect } from "next/navigation";
import CatalogShell from "../../catalog-shell";
import { CategoryForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const { error } = await searchParams;
  const count = catalog.products.filter((product) => product.category === slug).length;
  return (
    <CatalogShell section="categories" title={`Edit ${category.name}`} intro="Update the label, description, or shipping rule. The slug remains stable for existing links." ready={catalog.ready} error={error}>
      <CategoryForm category={category} />
      <form className="admin-archive-form" action="/api/admin/catalog" method="post">
        <input type="hidden" name="type" value="category" /><input type="hidden" name="operation" value="archive" /><input type="hidden" name="slug" value={slug} />
        <h3>Delete category</h3><p>{count ? `Move or delete its ${count} products first.` : "This removes the category from the shop; historical orders are retained."}</p>
        <label><input type="checkbox" required disabled={count > 0} /> I understand this category will be removed from the shop.</label>
        <button type="submit" disabled={count > 0}>Delete category</button>
      </form>
    </CatalogShell>
  );
}
