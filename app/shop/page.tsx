import type { Metadata } from "next";
import ShopCatalog from "../ui/shop-catalog";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";
import { categoryOrder, type ProductCategory } from "../data/products";

export const metadata: Metadata = {
  title: "Shop Bags, Boards & Apparel | YG Cornhole",
  description: "Shop YG Cornhole competition bags, custom boards, T-shirts, performance jerseys, and hoodies.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const validCategory = categoryOrder.some((item) => item.slug === category) ? category as ProductCategory : "all";

  return (
    <main className="store-page" id="main-content">
      <SiteHeader />
      <section className="shop-hero">
        <div>
          <span>YG / Bags, boards & apparel</span>
          <h1>Gear built around the game.</h1>
        </div>
        <p>Competition bags, regulation custom boards, everyday cotton, and full-print team gear—all carrying the same player-first point of view.</p>
      </section>
      <ShopCatalog initialCategory={validCategory} />
      <StoreFooter />
    </main>
  );
}
