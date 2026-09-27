import { shippingCentsForCart, validProductSelection, type Product } from "../data/products";

export type CheckoutLineInput = {
  slug: string;
  quantity: number;
  size: string;
  color: string;
  options?: Record<string, string>;
};

type PricedLine = CheckoutLineInput & {
  name: string;
  unitAmount: number;
};

export function priceCheckout(rawLines: unknown, catalog: readonly Product[]) {
  if (!Array.isArray(rawLines) || rawLines.length === 0 || rawLines.length > 30) {
    throw new Error("Your cart is empty or invalid.");
  }

  const lines: PricedLine[] = rawLines.map((rawLine) => {
    if (!rawLine || typeof rawLine !== "object") throw new Error("A cart item is invalid.");
    const candidate = rawLine as Partial<CheckoutLineInput>;
    const product = typeof candidate.slug === "string" ? catalog.find((item) => item.slug === candidate.slug) : undefined;
    const quantity = Number(candidate.quantity);

    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error("A cart item is invalid.");
    }
    if (typeof candidate.size !== "string" || typeof candidate.color !== "string"
        || (candidate.options !== undefined && (typeof candidate.options !== "object" || candidate.options === null || Array.isArray(candidate.options)))
        || !validProductSelection(product, { size: candidate.size, color: candidate.color, options: candidate.options })) {
      throw new Error(`Choose currently available options for ${product.name}.`);
    }

    return {
      slug: product.slug,
      name: product.name,
      quantity,
      size: candidate.size,
      color: candidate.color,
      ...((product.customOptions?.length ?? 0) > 0 ? {
        options: Object.fromEntries((product.customOptions ?? []).map((option) => [option.name, candidate.options?.[option.name] ?? option.values[0]])),
      } : {}),
      unitAmount: Math.round(product.price * 100),
    };
  });

  const subtotal = lines.reduce((total, line) => total + line.unitAmount * line.quantity, 0);
  const shipping = shippingCentsForCart(lines, catalog);

  return { lines, subtotal, shipping, total: subtotal + shipping };
}

export function cents(value: number) {
  return (value / 100).toFixed(2);
}
