"use client";

import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { categoryOrder, products, type ProductCategory } from "../data/products";
import StoreProductCard from "./store-product-card";

type Filter = "all" | ProductCategory;
type Sort = "featured" | "price-low" | "price-high" | "name";

export default function ShopCatalog({ initialCategory = "all" }: { initialCategory?: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [sort, setSort] = useState<Sort>("featured");

  const visibleProducts = useMemo(() => {
    const filtered = filter === "all" ? [...products] : products.filter((product) => product.category === filter);
    if (sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
    if (sort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [filter, sort]);

  const activeName = filter === "all" ? "All gear" : categoryOrder.find((category) => category.slug === filter)?.name;

  return (
    <section className="catalog-shell" aria-labelledby="catalog-title">
      <aside className="catalog-sidebar" aria-label="Product categories">
        <div className="catalog-sidebar__heading"><SlidersHorizontal size={18} /><h2>Categories</h2></div>
        <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>All products <span>{products.length}</span></button>
        <div className="catalog-category-list">
          {categoryOrder.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category.slug);
            return (
              <details key={category.slug} open={filter === category.slug || category.slug === "t-shirts"}>
                <summary>
                  <span>{category.name}<small>{categoryProducts.length} styles</small></span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <div>
                  <button className={filter === category.slug ? "is-active" : ""} onClick={() => setFilter(category.slug)}>Show all {category.name}</button>
                  {categoryProducts.map((product) => <Link href={`/shop/${product.slug}`} key={product.slug}>{product.name}</Link>)}
                </div>
              </details>
            );
          })}
        </div>
      </aside>

      <div className="catalog-results">
        <div className="catalog-toolbar">
          <div><span>Showing {visibleProducts.length} products</span><h1 id="catalog-title">{activeName}</h1></div>
          <label>Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="store-product-grid">
          {visibleProducts.map((product) => <StoreProductCard product={product} key={product.slug} />)}
        </div>
      </div>
    </section>
  );
}
