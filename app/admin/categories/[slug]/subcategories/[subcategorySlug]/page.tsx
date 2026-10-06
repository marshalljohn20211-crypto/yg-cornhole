import { notFound, redirect } from "next/navigation";
import CatalogShell from "../../../../catalog-shell";
import { SubcategoryForm } from "../../../../catalog-forms";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { getCatalog } from "../../../../../lib/catalog";

export default async function EditSubcategoryPage({ params, searchParams }: { params: Promise<{ slug: string; subcategorySlug: string }>; searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { slug, subcategorySlug } = await params;
  const catalog = await getCatalog();
  const category = catalog.categories.find((item) => item.slug === slug);
  const subcategory = catalog.subcategories.find((item) => item.slug === subcategorySlug && item.category === slug);
  if (!category || !subcategory) notFound();
  const productCount = catalog.products.filter((product) => product.subcategory === subcategory.slug).length;
  const { error } = await searchParams;
  return (
    <CatalogShell section="categories" title={`Edit ${subcategory.name}`} intro={`Optional group inside ${category.name}. Its shared price applies only to products that choose to inherit it.`} ready={catalog.ready} error={error}>
      <SubcategoryForm category={category} subcategory={subcategory} />
      <form className="admin-archive-form" action="/api/admin/catalog" method="post">
        <input type="hidden" name="type" value="subcategory" /><input type="hidden" name="operation" value="archive" /><input type="hidden" name="slug" value={subcategory.slug} /><input type="hidden" name="category" value={category.slug} />
        <h3>Delete subcategory</h3><p>{productCount ? `Move its ${productCount} products directly into ${category.name} or another subcategory first.` : `This removes the optional group from ${category.name}.`}</p>
        <label><input type="checkbox" required disabled={productCount > 0} /> I understand this subcategory will be removed.</label>
        <button type="submit" disabled={productCount > 0}>Delete subcategory</button>
      </form>
    </CatalogShell>
  );
}
