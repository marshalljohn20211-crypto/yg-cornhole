import "server-only";

import { cleanupAbandonedOrders, expireVerifiedAbandonedOrder, pendingOrdersForReconciliation, saveOrder, touchPendingOrder, type StoredOrder } from "./orders";
import { paypalRequest } from "./paypal";

type PayPalCapture = {
  id?: string;
  status?: string;
  amount?: { currency_code?: string; value?: string };
};

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: Array<{ payments?: { captures?: PayPalCapture[] } }>;
};

function captureFrom(order: PayPalOrder) {
  return order.purchase_units?.flatMap((unit) => unit.payments?.captures ?? [])
    .find((capture) => capture.status === "COMPLETED");
}

function matchesStoredTotal(order: StoredOrder, capture: PayPalCapture) {
  const value = capture.amount?.value;
  return capture.amount?.currency_code === order.currency
    && typeof value === "string"
    && Math.round(Number(value) * 100) === order.total;
}

async function reconcileOrder(order: StoredOrder) {
  let remote = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(order.id)}`);
  if (remote.status === "APPROVED") {
    remote = await paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(order.id)}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `capture-${order.id}` },
    });
  }

  const capture = captureFrom(remote);
  if (remote.status === "COMPLETED") {
    if (!capture?.id || !matchesStoredTotal(order, capture)) {
      throw new Error("Completed PayPal order did not match the stored total.");
    }
    await saveOrder({
      ...order,
      captureId: capture.id,
      status: "paid",
      paymentStatus: "COMPLETED",
      paidAt: order.paidAt ?? new Date().toISOString(),
    });
    return "recovered" as const;
  }
  if (remote.status === "VOIDED") {
    await saveOrder({ ...order, status: "payment_failed", paymentStatus: "VOIDED" });
    return "failed" as const;
  }
  if (remote.status === "CREATED" && await expireVerifiedAbandonedOrder(order.id)) {
    return "expired" as const;
  }
  await touchPendingOrder(order.id);
  return "pending" as const;
}

export async function runOrderMaintenance() {
  const pending = await pendingOrdersForReconciliation(25);
  const result = { checked: pending.length, recovered: 0, stillPending: 0, failed: 0, errors: 0, expired: 0, deleted: 0 };
  for (const order of pending) {
    try {
      const status = await reconcileOrder(order);
      if (status === "recovered") result.recovered += 1;
      else if (status === "failed") result.failed += 1;
      else if (status === "expired") result.expired += 1;
      else result.stillPending += 1;
    } catch {
      result.errors += 1;
    }
  }
  const cleanup = await cleanupAbandonedOrders();
  result.deleted = cleanup.deleted;
  return result;
}
