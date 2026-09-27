import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import CatalogShell from "../catalog-shell";
import CatalogDeleteButton from "../catalog-delete-button";
import { isAdminAuthenticated } from "../../lib/admin-auth";
import { getCatalog } from "../../lib/catalog";

export const metadata: Metadata = { title: "Products | YG Cornhole Admin", robots: { index: false } };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ edited?: string; saved?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const catalog = await getCatalog();
  const params = await searchParams;
  return (
    <CatalogShell section="products" title="Products" intro="Add products with guided choices for apparel, bags, and boards. Edit or delete any listing here; past orders keep their original details." ready={catalog.ready} saved={params.edited ?? params.saved}>
      {catalog.ready ? <Link className="admin-primary-link" href="/admin/products/new">Add product</Link> : null}
      <div className="admin-catalog-list">
        {catalog.products.map((product) => <article key={product.slug} className="admin-product-row"><Image src={product.image} alt="" width={90} height={90} /><div><h3>{product.name}</h3><p>{product.categoryLabel} · ${product.price.toFixed(2)}</p><small>{product.sizes.join(", ")} · {product.colors.join(", ")}</small></div><div className="admin-row-actions"><Link href={`/admin/products/${product.slug}`}>Edit</Link><CatalogDeleteButton type="product" slug={product.slug} name={product.name} /></div></article>)}
      </div>
    </CatalogShell>
  );
}
