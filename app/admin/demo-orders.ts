import "server-only";

import { ORDER_STATUSES, type OrderStatus, type StoredOrder } from "../lib/orders";

const paidStatuses = new Set<OrderStatus>(["paid", "processing", "shipped", "completed", "refunded"]);

function paymentStatus(status: OrderStatus) {
  if (status === "refunded") return "REFUNDED";
  if (status === "payment_failed") return "DENIED";
  if (status === "expired") return "EXPIRED";
  return paidStatuses.has(status) ? "COMPLETED" : "CREATED";
}

export function demoOrders(): StoredOrder[] {
  const now = Date.now();

  return ORDER_STATUSES.map((status, index) => {
    const paid = paidStatuses.has(status);
    const createdAt = new Date(now - (index + 1) * 3_600_000).toISOString();

    return {
      id: `DEMO-${status.toUpperCase().replaceAll("_", "-")}`,
      status,
      paymentStatus: paymentStatus(status),
      createdAt,
      updatedAt: createdAt,
      ...(paid ? { captureId: `DEMO-CAPTURE-${index + 1}`, paidAt: new Date(now - (index + 1) * 3_600_000 + 300_000).toISOString() } : {}),
      ...(status === "shipped" || status === "completed" ? { trackingNumber: "DEMO-TRACKING-123" } : {}),
      ...(status === "completed" ? { fulfilledAt: new Date(now - 600_000).toISOString() } : {}),
      customer: {
        fullName: "Demo Customer",
        email: "customer@example.com",
        phone: "000-000-0000",
        addressLine1: "123 Example Street",
        addressLine2: "",
        city: "Sample City",
        state: "TX",
        postalCode: "75001",
        countryCode: "US",
        deliveryNotes: "Example only — not a real delivery.",
      },
      items: [{ slug: "demo-item", name: "Sample product", quantity: 1, size: "M", color: "Blue", unitAmount: 2499 }],
      subtotal: 2499,
      shipping: 0,
      total: 2499,
      currency: "USD",
    };
  });
}
