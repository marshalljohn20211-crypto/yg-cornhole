import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CatalogShell from "../../catalog-shell";
import CatalogDeleteButton from "../../catalog-delete-button";
import { CategoryForm } from "../../catalog-forms";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { getCatalog } from "../../../lib/catalog";

export default async function EditCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; saved?: string; view?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const { error, saved, view: requestedView } = await searchParams;
  const count = catalog.products.filter((product) => product.category === slug).length;
  const subcategories = catalog.subcategories.filter((subcategory) => subcategory.category === slug);
  const view = requestedView === "subcategories" || requestedView === "products" ? requestedView : "details";
  return (
    <CatalogShell section="categories" title={category.name} intro="Manage this category without mixing product, subcategory, and category settings on one screen." ready={catalog.ready} error={error} saved={saved}>
      <section className="admin-category-workspace">
        <div className="admin-category-workspace__summary"><div><span>Category workspace</span><h3>{category.name}</h3><p>{category.description}</p></div><dl><div><dt>Products</dt><dd>{count}</dd></div><div><dt>Subcategories</dt><dd>{subcategories.length}</dd></div><div><dt>Shipping</dt><dd>${((category.shippingCents ?? 0) / 100).toFixed(2)}</dd></div></dl></div>
        <nav className="admin-workspace-tabs" aria-label={`${category.name} management`}>
          <Link href={`/admin/categories/${slug}`} aria-current={view === "details" ? "page" : undefined}>Category details</Link>
          <Link href={`/admin/categories/${slug}?view=subcategories`} aria-current={view === "subcategories" ? "page" : undefined}>Subcategories <span>{subcategories.length}</span></Link>
          <Link href={`/admin/categories/${slug}?view=products`} aria-current={view === "products" ? "page" : undefined}>Products <span>{count}</span></Link>
        </nav>
      </section>

      {view === "details" ? <>
        <CategoryForm category={category} />
        <form className="admin-archive-form" action="/api/admin/catalog" method="post">
          <input type="hidden" name="type" value="category" /><input type="hidden" name="operation" value="archive" /><input type="hidden" name="slug" value={slug} />
          <h3>Delete category</h3><p>{count || subcategories.length ? `Move or delete its ${count} products and ${subcategories.length} subcategories first.` : "This removes the category from the shop; historical orders are retained."}</p>
          <label><input type="checkbox" required disabled={count > 0 || subcategories.length > 0} /> I understand this category will be removed from the shop.</label>
          <button type="submit" disabled={count > 0 || subcategories.length > 0}>Delete category</button>
        </form>
      </> : null}

      {view === "subcategories" ? <section className="admin-workspace-panel">
        <div className="admin-workspace-panel__heading"><div><span>Optional organization</span><h3>Subcategories</h3><p>Use groups only when they help customers browse. Products can also stay directly inside {category.name}.</p></div>{catalog.subcategoriesReady ? <Link className="admin-primary-link" href={`/admin/categories/${category.slug}/subcategories/new`}>Add subcategory</Link> : null}</div>
        {!catalog.subcategoriesReady ? <p className="admin-notice is-error">Run <code>db/migrations/2026-10-07-catalog-subcategories.sql</code> to enable subcategories. Existing products are unchanged.</p> : null}
        {catalog.subcategoriesReady && subcategories.length === 0 ? <p className="admin-empty-state">No subcategories yet. Add one, or keep products directly in this category.</p> : null}
        <div className="admin-catalog-list">
          {subcategories.map((subcategory) => { const productCount = catalog.products.filter((product) => product.subcategory === subcategory.slug).length; return <article key={subcategory.slug}><div><h3>{subcategory.name}</h3><p>{subcategory.description || `Optional group inside ${category.name}.`}</p><small>{productCount} products · {subcategory.defaultPrice ? `$${subcategory.defaultPrice.toFixed(2)} shared price available` : "Products use their own prices"}</small></div><div className="admin-row-actions"><Link href={`/admin/categories/${category.slug}/subcategories/${subcategory.slug}`}>Edit</Link><CatalogDeleteButton type="subcategory" slug={subcategory.slug} category={category.slug} name={subcategory.name} disabled={productCount > 0} reason={productCount > 0 ? `Move or delete its ${productCount} products first` : undefined} /></div></article>; })}
        </div>
      </section> : null}

      {view === "products" ? <section className="admin-workspace-panel">
        <div className="admin-workspace-panel__heading"><div><span>Products in this category</span><h3>Products</h3><p>Sizes and customer choices are managed on each product because products can have different size ranges.</p></div><Link className="admin-primary-link" href={`/admin/products/new?category=${category.slug}`}>Add product</Link></div>
        {count === 0 ? <p className="admin-empty-state">No products are assigned to {category.name} yet.</p> : null}
        <div className="admin-catalog-list">{catalog.products.filter((product) => product.category === slug).map((product) => <article key={product.slug}><div><h3>{product.name}</h3><p>{product.subcategoryLabel ? `Subcategory: ${product.subcategoryLabel}` : `Directly in ${category.name}`}</p><small>${product.price.toFixed(2)} · Sizes/configurations: {product.sizes.join(", ")}</small></div><div className="admin-row-actions"><Link href={`/admin/products/${product.slug}`}>Manage product</Link></div></article>)}</div>
      </section> : null}
    </CatalogShell>
  );
}
