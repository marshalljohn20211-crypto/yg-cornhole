"use client";

import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Product, Subcategory } from "../data/products";
import StoreProductCard from "./store-product-card";

type Filter = "all" | string;
type Sort = "featured" | "price-low" | "price-high" | "name";
const PAGE_SIZE = 9;

export default function ShopCatalog({ initialCategory = "all", initialSubcategory, products, categories, subcategories }: { initialCategory?: Filter; initialSubcategory?: string; products: Product[]; categories: Category[]; subcategories: Subcategory[] }) {
  const [filter, setFilter] = useState<Filter>(initialCategory);
  const [subcategoryFilter, setSubcategoryFilter] = useState(initialSubcategory ?? "");
  const [sort, setSort] = useState<Sort>("featured");
  const [page, setPage] = useState(1);

  const visibleProducts = useMemo(() => {
    const filtered = filter === "all" ? [...products] : products.filter((product) => product.category === filter && (!subcategoryFilter || product.subcategory === subcategoryFilter));
    if (sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
    if (sort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [filter, subcategoryFilter, sort, products]);

  const activeName = subcategoryFilter ? subcategories.find((subcategory) => subcategory.slug === subcategoryFilter)?.name : filter === "all" ? "All gear" : categories.find((category) => category.slug === filter)?.name;
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = visibleProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function chooseCategory(next: Filter) { setFilter(next); setSubcategoryFilter(""); setPage(1); }
  function chooseSubcategory(category: string, subcategory: string) { setFilter(category); setSubcategoryFilter(subcategory); setPage(1); }
  function chooseSort(next: Sort) { setSort(next); setPage(1); }

  return (
    <section className="catalog-shell" aria-labelledby="catalog-title">
      <aside className="catalog-sidebar" aria-label="Product categories">
        <div className="catalog-sidebar__heading"><SlidersHorizontal size={18} /><h2>Categories</h2></div>
        <button className={filter === "all" ? "is-active" : ""} onClick={() => chooseCategory("all")}>All products <span>{products.length}</span></button>
        <div className="catalog-category-list">
          {categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category === category.slug);
            return (
              <details key={category.slug} open={filter === category.slug || category.slug === "t-shirts"}>
                <summary>
                  <span>{category.name}<small>{categoryProducts.length} styles</small></span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <div>
                  <button className={filter === category.slug && !subcategoryFilter ? "is-active" : ""} onClick={() => chooseCategory(category.slug)}>Show all {category.name}</button>
                  {subcategories.filter((subcategory) => subcategory.category === category.slug).map((subcategory) => <button className={subcategoryFilter === subcategory.slug ? "is-active" : ""} onClick={() => chooseSubcategory(category.slug, subcategory.slug)} key={subcategory.slug}>{subcategory.name} <span>{categoryProducts.filter((product) => product.subcategory === subcategory.slug).length}</span></button>)}
                  {categoryProducts.filter((product) => !product.subcategory).map((product) => <Link href={`/shop/${product.slug}`} key={product.slug}>{product.name}</Link>)}
                </div>
              </details>
            );
          })}
        </div>
      </aside>

      <div className="catalog-results">
        <div className="catalog-toolbar">
          <div><span>Showing {visibleProducts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, visibleProducts.length)} of {visibleProducts.length} products</span><h1 id="catalog-title">{activeName}</h1></div>
          <label>Sort by
            <select value={sort} onChange={(event) => chooseSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="store-product-grid">
          {pagedProducts.map((product) => <StoreProductCard product={product} key={product.slug} />)}
        </div>
        {visibleProducts.length === 0 ? <p className="catalog-empty">No products in this category yet.</p> : null}
        {totalPages > 1 ? <nav className="shop-pagination" aria-label="Shop pages"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index} aria-current={currentPage === index + 1 ? "page" : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button></nav> : null}
      </div>
    </section>
  );
}
