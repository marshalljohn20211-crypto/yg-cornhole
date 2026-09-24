"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { formatPrice, type Product } from "../data/products";
import { useCart } from "./cart-provider";

export default function ProductDetail({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const { addItem } = useCart();
  const isBag = product.category === "cornhole-bags";
  const isBoard = product.category === "custom-boards";
  const careDetails = isBoard ? "finish, durability, and repeatable play" : "identity, comfort, and repeat use";

  function addToCart() {
    addItem({ slug: product.slug, size, color, quantity });
    setStatus(`${quantity} × ${product.name} added to your cart.`);
    toast.success(`${quantity} × ${product.name} added to your cart`, {
      toastId: `${product.slug}:${size}:${color}`,
    });
  }

  return (
    <>
      <div className="product-breadcrumb">
        <Link href="/shop"><ChevronLeft size={16} /> Shop</Link><span>/</span><Link href={`/shop?category=${product.category}`}>{product.categoryLabel}</Link><span>/</span><b>{product.name}</b>
      </div>
      <section className="product-detail" aria-labelledby="product-title">
        <div className="product-gallery">
          <div className="product-gallery__index"><span>YG / PRODUCT</span><strong>{product.categoryLabel}</strong></div>
          <div className="product-gallery__stage">
            <Image src={product.image} alt={product.alt} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
          </div>
        </div>

        <div className="product-buybox">
          <span className="product-eyebrow">{product.eyebrow}</span>
          <h1 id="product-title">{product.name}</h1>
          <div className="product-price-row"><strong>{formatPrice(product.price)}</strong><span><Star size={14} fill="currentColor" /> 5.0 / player rated</span></div>
          <p className="product-description">{product.description}</p>
          {isBoard ? <p className="product-description">Shipping: $100 per board ordered, added at checkout.</p> : null}

          {isBag && product.speedFast && product.speedControl && (
            <div className="product-speed-profile" aria-label={`${product.speedFast} fast side and ${product.speedControl} control side`}>
              <span><strong>{product.speedFast}</strong><b>Fast side</b></span>
              <i aria-hidden="true" />
              <span><strong>{product.speedControl}</strong><b>Control side</b></span>
              <Link href="/acl-bags">Compare all ACL bags</Link>
            </div>
          )}

          <fieldset className="product-option">
            <legend>{isBag ? "Set" : isBoard ? "Configuration" : "Size"} <b>{size}</b></legend>
            <div>{product.sizes.map((option) => <button type="button" className={size === option ? "is-selected" : ""} onClick={() => setSize(option)} key={option}>{option}</button>)}</div>
          </fieldset>

          <fieldset className="product-option product-option--color">
            <legend>Color <b>{color}</b></legend>
            <div>{product.colors.map((option) => <button type="button" className={color === option ? "is-selected" : ""} onClick={() => setColor(option)} key={option}><i aria-hidden="true" />{option}</button>)}</div>
          </fieldset>

          <div className="product-purchase-row">
            <div className="quantity-control" aria-label="Quantity selector">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
              <output aria-label="Quantity">{quantity}</output>
              <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={16} /></button>
            </div>
            <button className="add-to-cart-button" type="button" onClick={addToCart}>Add to cart — {formatPrice(product.price * quantity)}</button>
          </div>
          <p className="cart-status" aria-live="polite">{status}</p>

          <div className="product-assurances">
            <span><Truck size={20} /><b>{isBoard ? "Board shipping" : "Free shipping"}</b>{isBoard ? "$100 per board, added at checkout" : "No shipping charge at checkout"}</span>
            <span><ShieldCheck size={20} /><b>Built with care</b>Checked before it leaves the shop</span>
          </div>
        </div>
      </section>

      <section className="product-specs" aria-labelledby="product-details-heading">
        <div><span>Product description</span><h2 id="product-details-heading">Made for the next game.</h2><p>{product.description} Built with the same attention to {careDetails} that runs through every YG Cornhole release.</p></div>
        <div className="product-feature-list">
          <h3>{isBag ? "Set details" : isBoard ? "Build details" : "Material & fit"}</h3>
          <ul>{product.features.map((feature) => <li key={feature}><Check size={17} />{feature}</li>)}</ul>
        </div>
      </section>
    </>
  );
}
