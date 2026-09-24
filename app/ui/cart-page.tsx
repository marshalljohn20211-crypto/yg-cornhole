"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPrice, products, shippingCentsForCart } from "../data/products";
import { useCart } from "./cart-provider";
import PayPalCheckout from "./paypal-checkout";

export default function CartPage({
  paypalEnvironment,
  paypalClientId,
}: {
  paypalEnvironment: "sandbox" | "live";
  paypalClientId: string;
}) {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const lines = items.flatMap((line) => {
    const product = products.find((candidate) => candidate.slug === line.slug);
    return product ? [{ ...line, product }] : [];
  });
  const unavailableItems = items.filter((line) => !products.some((product) => product.slug === line.slug));
  const availableItems = items.filter((line) => products.some((product) => product.slug === line.slug));
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const shipping = shippingCentsForCart(lines) / 100;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <section className="empty-cart">
        <ShoppingBag size={42} />
        <span>Your bag is ready</span>
        <h1>Build your game-day loadout.</h1>
        <p>Add competition bags or YG apparel and your selections will stay here for the next visit.</p>
        {unavailableItems.length > 0 ? <button type="button" onClick={() => unavailableItems.forEach((item) => removeItem(item.key))}>Remove unavailable item{unavailableItems.length === 1 ? "" : "s"}</button> : null}
        <Link href="/shop">Explore the shop <ArrowRight size={17} /></Link>
      </section>
    );
  }

  return (
    <section className="cart-layout" aria-labelledby="cart-title">
      <div className="cart-lines">
        <div className="cart-heading"><div><span>Your selections</span><h1 id="cart-title">Your cart.</h1></div><button type="button" onClick={clearCart}>Clear cart</button></div>
        {lines.map((line) => (
          <article className="cart-line" key={line.key}>
            <Link className="cart-line__image" href={`/shop/${line.product.slug}`}><Image src={line.product.image} alt={line.product.alt} fill sizes="160px" /></Link>
            <div className="cart-line__copy">
              <span>{line.product.categoryLabel}</span>
              <h2><Link href={`/shop/${line.product.slug}`}>{line.product.name}</Link></h2>
              <p>{line.size} · {line.color}</p>
              <strong>{formatPrice(line.product.price)}</strong>
            </div>
            <div className="cart-line__actions">
              <div className="quantity-control">
                <button type="button" onClick={() => updateQuantity(line.key, line.quantity - 1)} aria-label={`Decrease ${line.product.name} quantity`}><Minus size={15} /></button>
                <output>{line.quantity}</output>
                <button type="button" onClick={() => updateQuantity(line.key, line.quantity + 1)} aria-label={`Increase ${line.product.name} quantity`}><Plus size={15} /></button>
              </div>
              <button type="button" onClick={() => removeItem(line.key)} aria-label={`Remove ${line.product.name}`}><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </div>

      <aside className="cart-summary">
        <span>Order summary</span>
        <h2>Ready for the lane.</h2>
        <dl><div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div><div><dt>Shipping{shipping > 0 ? " (boards)" : " (free)"}</dt><dd>{formatPrice(shipping)}</dd></div><div><dt>Total</dt><dd>{formatPrice(total)}</dd></div></dl>
        {unavailableItems.length > 0 ? <p>Some saved products are no longer available. <button type="button" onClick={() => unavailableItems.forEach((item) => removeItem(item.key))}>Remove them from your cart</button></p> : null}
        <PayPalCheckout environment={paypalEnvironment} clientId={paypalClientId} items={availableItems} />
        <p>Choose PayPal or enter a debit or credit card. Your payment details are handled securely by PayPal.</p>
        <Link href="/shop">Continue shopping</Link>
      </aside>
    </section>
  );
}
