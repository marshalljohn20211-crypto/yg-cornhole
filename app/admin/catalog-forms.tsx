"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product, Subcategory } from "../data/products";

function list(values: string[] | undefined) {
  return values?.join("\n") ?? "";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

type ProductKind = "apparel" | "bags" | "boards" | "general";

function productKind(category?: Category): ProductKind {
  const value = `${category?.slug ?? ""} ${category?.name ?? ""}`.toLowerCase();
  if (/shirt|tee|jersey|hoodie|apparel/.test(value)) return "apparel";
  if (/bag/.test(value)) return "bags";
  if (/board/.test(value)) return "boards";
  return "general";
}

function defaultSizes(kind: ProductKind) {
  if (kind === "apparel") return ["S", "M", "L", "XL", "2XL", "3XL"];
  if (kind === "bags") return ["Set of 4"];
  if (kind === "boards") return ["Single board", "Regulation set"];
  return ["Standard"];
}

function ChoiceManager({ label, help, suggestions, selected, onChange }: { label: string; help: string; suggestions: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add(value: string) {
    const additions = value.split(",").map((item) => item.trim()).filter(Boolean).filter((choice, index, all) => all.findIndex((item) => item.toLowerCase() === choice.toLowerCase()) === index && !selected.some((item) => item.toLowerCase() === choice.toLowerCase()));
    if (!additions.length) return;
    onChange([...selected, ...additions]);
    setDraft("");
  }
  return (
    <fieldset className="admin-choice-fieldset admin-option-builder">
      <legend>{label}</legend>
      <small>{help}</small>
      <div className="admin-option-builder__selected" aria-label={`Current ${label.toLowerCase()}`}>
        {selected.map((choice) => <span key={choice}>{choice}<button type="button" onClick={() => onChange(selected.filter((item) => item !== choice))} aria-label={`Remove ${choice}`}>×</button></span>)}
        {!selected.length ? <em>No choices added yet.</em> : null}
      </div>
      <div className="admin-option-builder__add">
        <label>Add a custom size or configuration<input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(draft); } }} maxLength={100} placeholder="Example: XS, 4XL, Youth M, Set of 4" /></label>
        <button type="button" onClick={() => add(draft)} disabled={!draft.trim()}>Add choice</button>
      </div>
      <div className="admin-option-builder__suggestions"><span>Quick add</span>{suggestions.filter((choice) => !selected.includes(choice)).map((choice) => <button type="button" key={choice} onClick={() => add(choice)}>+ {choice}</button>)}</div>
    </fieldset>
  );
}

export function CategoryForm({ category }: { category?: Category }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  return (
    <form className="admin-editor" action="/api/admin/catalog" method="post">
      <input type="hidden" name="type" value="category" />
      <input type="hidden" name="operation" value={category ? "edit" : "create"} />
      <section className="admin-form-section"><div className="admin-form-section__intro"><span>1</span><div><h3>Category details</h3><p>Give customers a clear way to browse related products.</p></div></div><div className="admin-form-grid">
        <label>Category name <b>Required</b><input name="name" value={name} onChange={(event) => { setName(event.target.value); if (!category) setSlug(slugify(event.target.value)); }} maxLength={100} placeholder="Example: T-Shirts" required /></label>
        <label>Shipping per item (USD)<input name="shipping" type="number" min="0" max="100000" step="0.01" defaultValue={((category?.shippingCents ?? 0) / 100).toFixed(2)} required /><small>Enter 0 for free shipping.</small></label>
        <label className="admin-form-wide">Description <b>Required</b><textarea name="description" defaultValue={category?.description} maxLength={500} rows={3} required /></label>
      </div></section>
      <details className="admin-advanced"><summary>Advanced: category URL</summary><label>URL name<input name="slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} readOnly={Boolean(category)} required /><small>Created automatically from the name. It cannot be changed later.</small></label></details>
      <div className="admin-editor-actions"><button type="submit">{category ? "Save category" : "Create category"}</button><Link href="/admin/categories">Cancel</Link></div>
    </form>
  );
}

export function SubcategoryForm({ category, subcategory }: { category: Category; subcategory?: Subcategory }) {
  const [name, setName] = useState(subcategory?.name ?? "");
  const [slug, setSlug] = useState(subcategory?.slug ?? "");
  return (
    <form className="admin-editor" action="/api/admin/catalog" method="post">
      <input type="hidden" name="type" value="subcategory" />
      <input type="hidden" name="operation" value={subcategory ? "edit" : "create"} />
      <input type="hidden" name="category" value={category.slug} />
      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>1</span><div><h3>{subcategory ? "Edit subcategory" : "Subcategory details"}</h3><p>Use a subcategory only when it makes this section easier to browse.</p></div></div>
        <div className="admin-form-grid">
          <label>Subcategory name <b>Required</b><input name="name" value={name} onChange={(event) => { setName(event.target.value); if (!subcategory) setSlug(slugify(`${category.slug}-${event.target.value}`)); }} maxLength={100} placeholder="Example: Graphic Tees" required /></label>
          <label>Shared product price <b>Optional</b><div className="admin-price-input"><span>$</span><input name="defaultPrice" type="number" min="0.01" max="100000" step="0.01" defaultValue={subcategory?.defaultPrice?.toFixed(2)} placeholder="Leave blank for individual prices" /></div><small>Products may inherit this price or keep their own.</small></label>
          <label className="admin-form-wide">Description <b>Optional</b><textarea name="description" defaultValue={subcategory?.description} maxLength={500} rows={3} placeholder="Explain what belongs in this group." /></label>
        </div>
      </section>
      <details className="admin-advanced"><summary>Advanced: subcategory URL</summary><label>URL name<input name="slug" value={slug} onChange={(event) => setSlug(slugify(event.target.value))} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} readOnly={Boolean(subcategory)} required /><small>Created from the parent and subcategory names. It cannot be changed later.</small></label></details>
      <div className="admin-editor-actions"><button type="submit">{subcategory ? "Save subcategory" : "Create subcategory"}</button><Link href={`/admin/categories/${category.slug}?view=subcategories`}>Cancel</Link></div>
    </form>
  );
}

export function ProductForm({ product, categories, subcategories, initialCategorySlug }: { product?: Product; categories: Category[]; subcategories: Subcategory[]; initialCategorySlug?: string }) {
  const initialCategory = categories.find((category) => category.slug === product?.category) ?? categories.find((category) => category.slug === initialCategorySlug) ?? categories[0];
  const [categorySlug, setCategorySlug] = useState(initialCategory?.slug ?? "");
  const category = useMemo(() => categories.find((item) => item.slug === categorySlug), [categories, categorySlug]);
  const availableSubcategories = useMemo(() => subcategories.filter((item) => item.category === categorySlug), [subcategories, categorySlug]);
  const [subcategorySlug, setSubcategorySlug] = useState(product?.subcategory ?? "");
  const subcategory = useMemo(() => availableSubcategories.find((item) => item.slug === subcategorySlug), [availableSubcategories, subcategorySlug]);
  const [priceSource, setPriceSource] = useState<"product" | "subcategory">(product?.priceSource === "subcategory" ? "subcategory" : "product");
  const kind = productKind(category);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [sizes, setSizes] = useState(product?.sizes ?? defaultSizes(kind));
  const customOption = product?.customOptions?.[0];
  const [optionName, setOptionName] = useState(customOption?.name ?? (kind === "boards" ? "Dimensions" : ""));
  const [optionValues, setOptionValues] = useState(customOption?.values.join(", ") ?? (kind === "boards" ? "24 × 48 in (regulation)" : ""));

  function changeCategory(nextSlug: string) {
    const nextKind = productKind(categories.find((item) => item.slug === nextSlug));
    setCategorySlug(nextSlug);
    setSubcategorySlug("");
    setPriceSource("product");
    setSizes(defaultSizes(nextKind));
    setOptionName(nextKind === "boards" ? "Dimensions" : "");
    setOptionValues(nextKind === "boards" ? "24 × 48 in (regulation)" : "");
  }

  function changeName(nextName: string) {
    setName(nextName);
    if (!slugEdited) setSlug(slugify(nextName));
  }

  const choiceLabel = kind === "apparel" ? "Available sizes" : kind === "bags" ? "Set configurations" : kind === "boards" ? "Board packages" : "Sizes or configurations";
  const choiceHelp = kind === "apparel" ? "Add every apparel size customers can choose." : kind === "bags" ? "Add each bag set customers can order." : kind === "boards" ? "Add the board packages customers can purchase." : "Add the exact size or configuration labels customers will see.";

  return (
    <form className="admin-editor admin-product-editor" action="/api/admin/catalog" method="post" encType="multipart/form-data">
      <input type="hidden" name="type" value="product" />
      <input type="hidden" name="operation" value={product ? "edit" : "create"} />
      <input type="hidden" name="sizes" value={sizes.join(",")} />
      <input type="hidden" name="image" value={product?.image ?? ""} />

      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>1</span><div><h3>What are you selling?</h3><p>Start with the information customers see in the shop.</p></div></div>
        <div className="admin-form-grid">
          <label>Product name <b>Required</b><input name="name" value={name} onChange={(event) => changeName(event.target.value)} maxLength={120} placeholder="Example: Liberty Jersey" required /></label>
          <label>Category <b>Required</b><select name="category" value={categorySlug} onChange={(event) => changeCategory(event.target.value)} required>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label>Subcategory <b>Optional</b><select name="subcategory" value={subcategorySlug} onChange={(event) => { const next = event.target.value; setSubcategorySlug(next); if (!availableSubcategories.find((item) => item.slug === next)?.defaultPrice) setPriceSource("product"); }}><option value="">No subcategory — place directly in {category?.name}</option>{availableSubcategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}{item.defaultPrice ? ` — $${item.defaultPrice.toFixed(2)} shared price available` : ""}</option>)}</select><small>You can leave this blank.</small></label>
          <div className="admin-pricing-choice">
            <span>Pricing</span>
            {subcategory?.defaultPrice ? <div className="admin-price-source"><label><input type="radio" name="priceSource" value="product" checked={priceSource === "product"} onChange={() => setPriceSource("product")} /> Use this product&apos;s own price</label><label><input type="radio" name="priceSource" value="subcategory" checked={priceSource === "subcategory"} onChange={() => setPriceSource("subcategory")} /> Use {subcategory.name}&apos;s shared price (${subcategory.defaultPrice.toFixed(2)})</label></div> : <input type="hidden" name="priceSource" value="product" />}
            <label className={priceSource === "subcategory" ? "is-muted" : ""}>Product price <b>{priceSource === "subcategory" ? "Not used while shared price is selected" : "Required"}</b><div className="admin-price-input"><span>$</span><input name="price" type="number" min="0.01" max="100000" step="0.01" defaultValue={product?.price.toFixed(2)} placeholder="24.99" required={priceSource === "product"} disabled={priceSource === "subcategory"} /></div></label>
          </div>
          <label>Store badge <b>Optional</b><input name="badge" defaultValue={product?.badge} maxLength={40} placeholder="New, Bestseller, Limited" /></label>
          <label className="admin-form-wide">Description <b>Required</b><textarea name="description" defaultValue={product?.description} rows={4} maxLength={2000} placeholder="Tell the customer what makes this product worth buying." required /></label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>2</span><div><h3>Sizes & customer choices</h3><p>Sizes are managed here on each product—not on its category or subcategory.</p></div></div>
        <ChoiceManager label={choiceLabel} help={choiceHelp} suggestions={defaultSizes(kind)} selected={sizes} onChange={setSizes} />
        <div className="admin-form-grid admin-form-grid--choices">
          <label className="admin-form-wide">Available colors or finishes <b>Required</b><input name="colors" defaultValue={product?.colors.join(", ")} placeholder="Example: Black, White, Navy" required /><small>Separate each choice with a comma. If there is only one, enter that one color or finish.</small></label>
          {kind === "boards" ? <><label>Board option name<input name="optionName" value={optionName} onChange={(event) => setOptionName(event.target.value)} /></label><label>Available dimensions<input name="optionValues" value={optionValues} onChange={(event) => setOptionValues(event.target.value)} placeholder="24 × 48 in (regulation)" /><small>Separate multiple dimensions with commas.</small></label></> : null}
          {kind === "bags" ? <><label>Fast-side speed <b>Optional · 0–10</b><input name="speedFast" type="number" min="0" max="10" step="0.5" defaultValue={product?.speedFast} placeholder="9" /></label><label>Control-side speed <b>Optional · 0–10</b><input name="speedControl" type="number" min="0" max="10" step="0.5" defaultValue={product?.speedControl} placeholder="5" /></label></> : null}
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>3</span><div><h3>Add the product photo</h3><p>Use a clear front-facing image. Existing products keep their current photo unless you upload another.</p></div></div>
        <div className="admin-media-fields">
          {product?.image ? <div className="admin-image-preview"><Image src={product.image} alt={product.alt} width={180} height={180} /></div> : <div className="admin-image-placeholder">No image selected</div>}
          <label>Product image <b>{product ? "Optional replacement" : "Required"}</b><input name="upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required={!product} /><small>JPG, PNG, WebP, or AVIF. Maximum 2 MB.</small></label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>4</span><div><h3>Helpful details</h3><p>Add short points customers may want to know before ordering.</p></div></div>
        <label className="admin-block-label">Features <b>Optional · one per line</b><textarea name="features" defaultValue={list(product?.features)} rows={5} placeholder={kind === "apparel" ? "Soft ring-spun cotton\nModern fit\nMachine washable" : "Durable construction\nMade for competition play"} /></label>
      </section>

      <details className="admin-advanced">
        <summary>Advanced options</summary>
        <div className="admin-form-grid">
          <label>Product URL<input name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} readOnly={Boolean(product)} required /><small>Created automatically from the product name.</small></label>
          <label>Short shop label <b>Optional</b><input name="eyebrow" defaultValue={product?.eyebrow} maxLength={80} placeholder={category?.name ?? "Shop gear"} /></label>
          <label>Image description <b>Optional</b><input name="alt" defaultValue={product?.alt} maxLength={180} placeholder={`${name || "Product"} product photo`} /></label>
          {kind !== "boards" ? <><label>Extra choice name <b>Optional</b><input name="optionName" value={optionName} onChange={(event) => setOptionName(event.target.value)} placeholder="Example: Style" /></label><label>Extra choice values <b>Optional</b><input name="optionValues" value={optionValues} onChange={(event) => setOptionValues(event.target.value)} placeholder="Classic, Premium" /><small>Separate choices with commas.</small></label></> : null}
        </div>
      </details>

      <div className="admin-editor-actions"><button type="submit" disabled={!sizes.length} title={!sizes.length ? "Add at least one size or configuration" : undefined}>{product ? "Save changes" : "Create product"}</button>{!sizes.length ? <span className="admin-editor-actions__warning">Add at least one size or configuration before saving.</span> : null}<Link href="/admin/products">Cancel</Link></div>
    </form>
  );
}
