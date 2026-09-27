import { notFound, redirect } from "next/navigation";
import CatalogShell from "../../catalog-shell";
import { ProductForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const { error } = await searchParams;
  return (
    <CatalogShell section="products" title={`Edit ${product.name}`} intro="Changes appear on the shop after saving. Existing paid orders keep their original item and price snapshots." ready={catalog.ready} error={error}>
      <ProductForm product={product} categories={catalog.categories} />
      <form className="admin-archive-form" action="/api/admin/catalog" method="post">
        <input type="hidden" name="type" value="product" /><input type="hidden" name="operation" value="archive" /><input type="hidden" name="slug" value={slug} />
        <h3>Delete product</h3><p>Remove this product from the shop. Past orders remain available in the order desk.</p>
        <label><input type="checkbox" required /> I understand this product will be removed from the shop.</label>
        <button type="submit">Delete product</button>
      </form>
    </CatalogShell>
  );
}
