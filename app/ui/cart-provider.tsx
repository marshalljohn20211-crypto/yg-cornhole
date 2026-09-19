"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type CartLine = {
  key: string;
  slug: string;
  quantity: number;
  size: string;
  color: string;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  addItem: (item: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "yg-cornhole-cart";
const EMPTY_CART: CartLine[] = [];
let memoryCart: CartLine[] | null = null;
const listeners = new Set<() => void>();

function readCart(): CartLine[] {
  if (memoryCart) return memoryCart;
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    memoryCart = stored ? JSON.parse(stored) : [];
  } catch {
    memoryCart = [];
  }

  return memoryCart ?? EMPTY_CART;
}

function emitCart(next: CartLine[]) {
  memoryCart = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY_CART);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    addItem: (item) => {
      const key = `${item.slug}:${item.size}:${item.color}`;
      const current = readCart();
      const existing = current.find((line) => line.key === key);
      emitCart(existing
        ? current.map((line) => line.key === key ? { ...line, quantity: line.quantity + item.quantity } : line)
        : [...current, { ...item, key }]);
    },
    updateQuantity: (key, quantity) => {
      if (quantity < 1) {
        emitCart(readCart().filter((line) => line.key !== key));
        return;
      }
      emitCart(readCart().map((line) => line.key === key ? { ...line, quantity } : line));
    },
    removeItem: (key) => emitCart(readCart().filter((line) => line.key !== key)),
    clearCart: () => emitCart([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
