import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "../../lib/catalog";
import ProductDetail from "../../ui/product-detail";
import SiteHeader from "../../ui/site-header";
import StoreFooter from "../../ui/store-footer";
import StoreProductCard from "../../ui/store-product-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const catalog = await getCatalog();
  const { slug } = await params;
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) return {};
  return { title: `${product.name} | YG Cornhole`, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const catalog = await getCatalog();
  const { slug } = await params;
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = catalog.products.filter((candidate) => candidate.category === product.category && candidate.slug !== product.slug).slice(0, 3);

  return (
    <main className="store-page" id="main-content">
      <SiteHeader />
      <ProductDetail key={product.slug} product={product} />
      {related.length > 0 && <section className="related-products"><div className="related-products__heading"><span>Stay in the category</span><h2>Built for the same rotation.</h2></div><div className="store-product-grid">{related.map((item) => <StoreProductCard product={item} key={item.slug} />)}</div></section>}
      <StoreFooter />
    </main>
  );
}
