import { getOrder, isPaidOrder } from "../../../../lib/orders";
import { verifyReceiptToken } from "../../../../lib/receipt";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function receiptText(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>) {
  const country = order.customer.countryCode === "US" ? "United States" : "Canada";
  const address = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} ${order.customer.postalCode}`,
    country,
  ].filter(Boolean);
  const itemLines = order.items.flatMap((item) => [
    `${item.quantity} x ${item.name}`,
    `    ${item.size} / ${item.color} @ ${money(item.unitAmount)} = ${money(item.unitAmount * item.quantity)}`,
  ]);

  return [
    "YG CORNHOLE",
    "PAYMENT RECEIPT",
    "========================================",
    `Order: ${order.id}`,
    `Capture: ${order.captureId}`,
    `Paid: ${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(order.paidAt!))} UTC`,
    `Payment status: ${order.paymentStatus}`,
    "",
    "CUSTOMER",
    order.customer.fullName,
    order.customer.email,
    order.customer.phone,
    "",
    "DELIVERY ADDRESS",
    ...address,
    ...(order.customer.deliveryNotes ? ["", `Delivery notes: ${order.customer.deliveryNotes}`] : []),
    "",
    "ITEMS",
    ...itemLines,
    "----------------------------------------",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${money(order.shipping)}`,
    `Total paid: ${money(order.total)}`,
    "========================================",
    "Thank you for your order.",
    "Keep this receipt for your records.",
    "",
  ].join("\r\n");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId)) {
    return Response.json({ error: "The order reference is invalid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as { receiptToken?: unknown } | null;
  if (!verifyReceiptToken(orderId, body?.receiptToken)) {
    return Response.json({ error: "This receipt link is invalid or incomplete." }, { status: 403 });
  }

  const order = await getOrder(orderId);
  if (!order || !isPaidOrder(order)) {
    return Response.json({ error: "A paid receipt is not available for this order." }, { status: 409 });
  }

  return new Response(receiptText(order), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="YG-Cornhole-receipt-${order.id}.txt"`,
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
