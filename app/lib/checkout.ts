import { getProduct } from "../data/products";

export type CheckoutLineInput = {
  slug: string;
  quantity: number;
  size: string;
  color: string;
};

type PricedLine = CheckoutLineInput & {
  name: string;
  unitAmount: number;
};

export function priceCheckout(rawLines: unknown) {
  if (!Array.isArray(rawLines) || rawLines.length === 0 || rawLines.length > 30) {
    throw new Error("Your cart is empty or invalid.");
  }

  const lines: PricedLine[] = rawLines.map((rawLine) => {
    if (!rawLine || typeof rawLine !== "object") throw new Error("A cart item is invalid.");
    const candidate = rawLine as Partial<CheckoutLineInput>;
    const product = typeof candidate.slug === "string" ? getProduct(candidate.slug) : undefined;
    const quantity = Number(candidate.quantity);

    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error("A cart item is invalid.");
    }
    if (typeof candidate.size !== "string" || !product.sizes.includes(candidate.size)) {
      throw new Error(`Choose a valid option for ${product.name}.`);
    }
    if (typeof candidate.color !== "string" || !product.colors.includes(candidate.color)) {
      throw new Error(`Choose a valid color for ${product.name}.`);
    }

    return {
      slug: product.slug,
      name: product.name,
      quantity,
      size: candidate.size,
      color: candidate.color,
      unitAmount: Math.round(product.price * 100),
    };
  });

  const subtotal = lines.reduce((total, line) => total + line.unitAmount * line.quantity, 0);
  const shipping = 995;

  return { lines, subtotal, shipping, total: subtotal + shipping };
}

export function cents(value: number) {
  return (value / 100).toFixed(2);
}
