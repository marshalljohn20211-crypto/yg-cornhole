"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "../data/products";

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

function ChoiceChecklist({ label, help, choices, selected, onChange }: { label: string; help: string; choices: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  return (
    <fieldset className="admin-choice-fieldset">
      <legend>{label}</legend>
      <small>{help}</small>
      <div className="admin-choice-pills">
        {choices.map((choice) => <label key={choice} className={selected.includes(choice) ? "is-selected" : ""}><input type="checkbox" checked={selected.includes(choice)} onChange={(event) => { const next = event.target.checked ? [...selected, choice] : selected.filter((item) => item !== choice); if (next.length) onChange(next); }} />{choice}</label>)}
      </div>
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

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const initialCategory = categories.find((category) => category.slug === product?.category) ?? categories[0];
  const [categorySlug, setCategorySlug] = useState(initialCategory?.slug ?? "");
  const category = useMemo(() => categories.find((item) => item.slug === categorySlug), [categories, categorySlug]);
  const kind = productKind(category);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [sizes, setSizes] = useState(product?.sizes ?? defaultSizes(kind));
  const customOption = product?.customOptions?.[0];
  const [optionName, setOptionName] = useState(customOption?.name ?? (kind === "boards" ? "Dimensions" : ""));
  const [optionValues, setOptionValues] = useState(customOption?.values.join(", ") ?? (kind === "boards" ? "24 × 48 in (regulation)" : ""));
  const sizeChoices = [...new Set([...defaultSizes(kind), ...sizes])];

  function changeCategory(nextSlug: string) {
    const nextKind = productKind(categories.find((item) => item.slug === nextSlug));
    setCategorySlug(nextSlug);
    setSizes(defaultSizes(nextKind));
    setOptionName(nextKind === "boards" ? "Dimensions" : "");
    setOptionValues(nextKind === "boards" ? "24 × 48 in (regulation)" : "");
  }

  function changeName(nextName: string) {
    setName(nextName);
    if (!slugEdited) setSlug(slugify(nextName));
  }

  const choiceLabel = kind === "apparel" ? "Available sizes" : kind === "bags" ? "How is it sold?" : kind === "boards" ? "Board package" : "Product choice";
  const choiceHelp = kind === "apparel" ? "Select every size customers can order." : kind === "bags" ? "Select the bag set customers receive." : kind === "boards" ? "Choose whether customers can buy one board, a pair, or both." : "Select the choices customers can order.";

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
          <label>Price <b>Required</b><div className="admin-price-input"><span>$</span><input name="price" type="number" min="0.01" max="100000" step="0.01" defaultValue={product?.price.toFixed(2)} placeholder="24.99" required /></div></label>
          <label>Store badge <b>Optional</b><input name="badge" defaultValue={product?.badge} maxLength={40} placeholder="New, Bestseller, Limited" /></label>
          <label className="admin-form-wide">Description <b>Required</b><textarea name="description" defaultValue={product?.description} rows={4} maxLength={2000} placeholder="Tell the customer what makes this product worth buying." required /></label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-section__intro"><span>2</span><div><h3>What can customers choose?</h3><p>The form shows the choices that make sense for {category?.name ?? "this category"}.</p></div></div>
        <ChoiceChecklist label={choiceLabel} help={choiceHelp} choices={sizeChoices} selected={sizes} onChange={setSizes} />
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

      <div className="admin-editor-actions"><button type="submit">{product ? "Save changes" : "Create product"}</button><Link href="/admin/products">Cancel</Link></div>
    </form>
  );
}
