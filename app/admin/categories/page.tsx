import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogShell from "../catalog-shell";
import CatalogDeleteButton from "../catalog-delete-button";
import { isAdminAuthenticated } from "../../lib/admin-auth";
import { getCatalog } from "../../lib/catalog";

export const metadata: Metadata = { title: "Categories | YG Cornhole Admin", robots: { index: false } };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edited?: string; saved?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const catalog = await getCatalog();
  const params = await searchParams;
  return (
    <CatalogShell section="categories" title="Categories" intro="Organize the shop and set shipping per product unit. Existing category URLs stay stable when you edit their names." ready={catalog.ready} saved={params.edited ?? params.saved}>
      {catalog.ready ? <Link className="admin-primary-link" href="/admin/categories/new">Add category</Link> : null}
      <div className="admin-catalog-list">
        {catalog.categories.map((category) => { const count = catalog.products.filter((product) => product.category === category.slug).length; return <article key={category.slug}><div><h3>{category.name}</h3><p>{category.description}</p><small>{count} products · ${((category.shippingCents ?? 0) / 100).toFixed(2)} shipping per item</small></div><div className="admin-row-actions"><Link href={`/admin/categories/${category.slug}`}>Edit</Link><CatalogDeleteButton type="category" slug={category.slug} name={category.name} disabled={count > 0} reason={count > 0 ? `Move or delete its ${count} products first` : undefined} /></div></article>; })}
      </div>
    </CatalogShell>
  );
}
