"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export default function CartLink() {
  const { count } = useCart();

  return (
    <Link className="bag-button cart-nav-link" href="/cart" aria-label={`Shopping bag with ${count} item${count === 1 ? "" : "s"}`}>
      <ShoppingBag size={20} />
      <span suppressHydrationWarning>{count}</span>
    </Link>
  );
}
