import type { Metadata } from "next";
import ShopCatalog from "../ui/shop-catalog";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";
import { getCatalog } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Shop Bags, Boards & Apparel | YG Cornhole",
  description: "Shop YG Cornhole competition bags, custom boards, T-shirts, performance jerseys, and hoodies.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; subcategory?: string }> }) {
  const { category, subcategory } = await searchParams;
  const catalog = await getCatalog();
  const validCategory = catalog.categories.some((item) => item.slug === category) ? category : "all";
  const validSubcategory = validCategory !== "all" && catalog.subcategories.some((item) => item.slug === subcategory && item.category === validCategory) ? subcategory : undefined;

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
      <ShopCatalog key={`${validCategory}:${validSubcategory ?? ""}`} initialCategory={validCategory} initialSubcategory={validSubcategory} products={catalog.products} categories={catalog.categories} subcategories={catalog.subcategories} />
      <StoreFooter />
    </main>
  );
}
