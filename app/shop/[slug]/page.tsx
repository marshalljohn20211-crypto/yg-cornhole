import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "../../data/products";
import ProductDetail from "../../ui/product-detail";
import SiteHeader from "../../ui/site-header";
import StoreFooter from "../../ui/store-footer";
import StoreProductCard from "../../ui/store-product-card";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return { title: `${product.name} | YG Cornhole`, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const related = products.filter((candidate) => candidate.category === product.category && candidate.slug !== product.slug).slice(0, 3);

  return (
    <main className="store-page" id="main-content">
      <SiteHeader />
      <ProductDetail product={product} />
      {related.length > 0 && <section className="related-products"><div className="related-products__heading"><span>Stay in the category</span><h2>Built for the same rotation.</h2></div><div className="store-product-grid">{related.map((item) => <StoreProductCard product={item} key={item.slug} />)}</div></section>}
      <StoreFooter />
    </main>
  );
}
