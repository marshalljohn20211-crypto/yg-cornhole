import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { databaseUrl, getDatabase } from "./database";
import type { ShippingDetails } from "./order-details";

export const ORDER_STATUSES = [
  "pending", "paid", "processing", "shipped", "completed", "cancelled",
  "refunded", "expired", "payment_failed",
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export type StoredOrder = {
  id: string;
  checkoutKey?: string;
  checkoutFingerprint?: string;
  captureId?: string;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  fulfilledAt?: string;
  trackingNumber?: string;
  customer: ShippingDetails;
  items: Array<{
    slug: string;
    name: string;
    quantity: number;
    size: string;
    color: string;
    unitAmount: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
};

type OrderRow = RowDataPacket & {
  id: string;
  checkout_key: string | null;
  checkout_fingerprint: string | null;
  capture_id: string | null;
  status: OrderStatus;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
  paid_at: Date | null;
  fulfilled_at: Date | null;
  tracking_number: string | null;
  customer: ShippingDetails | string;
  items: StoredOrder["items"] | string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
};

type CountRow = RowDataPacket & { total: number };

function jsonValue<T>(value: T | string): T {
  return typeof value === "string" ? JSON.parse(value) as T : value;
}

function fromRow(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    ...(row.checkout_key ? { checkoutKey: row.checkout_key } : {}),
    ...(row.checkout_fingerprint ? { checkoutFingerprint: row.checkout_fingerprint } : {}),
    ...(row.capture_id ? { captureId: row.capture_id } : {}),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...(row.paid_at ? { paidAt: row.paid_at.toISOString() } : {}),
    ...(row.fulfilled_at ? { fulfilledAt: row.fulfilled_at.toISOString() } : {}),
    ...(row.tracking_number ? { trackingNumber: row.tracking_number } : {}),
    customer: jsonValue(row.customer),
    items: jsonValue(row.items),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    currency: row.currency,
  };
}

export function assertOrderStorageConfigured() {
  databaseUrl();
}

export function isPaidOrder(order: StoredOrder) {
  return Boolean(order.captureId && order.paidAt) && order.paymentStatus === "COMPLETED";
}

export async function saveOrder(order: StoredOrder) {
  await getDatabase().execute(
    `INSERT INTO orders (
      id, checkout_key, checkout_fingerprint, capture_id, status, payment_status,
      created_at, paid_at, fulfilled_at, tracking_number, customer, items,
      subtotal, shipping, total, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      checkout_key = COALESCE(VALUES(checkout_key), checkout_key),
      checkout_fingerprint = COALESCE(VALUES(checkout_fingerprint), checkout_fingerprint),
      capture_id = VALUES(capture_id), status = VALUES(status),
      payment_status = VALUES(payment_status), paid_at = VALUES(paid_at),
      fulfilled_at = VALUES(fulfilled_at), tracking_number = VALUES(tracking_number),
      customer = VALUES(customer), items = VALUES(items), subtotal = VALUES(subtotal),
      shipping = VALUES(shipping), total = VALUES(total), currency = VALUES(currency)`,
    [
      order.id, order.checkoutKey ?? null, order.checkoutFingerprint ?? null,
      order.captureId ?? null, order.status, order.paymentStatus, new Date(order.createdAt),
      order.paidAt ? new Date(order.paidAt) : null,
      order.fulfilledAt ? new Date(order.fulfilledAt) : null,
      order.trackingNumber ?? null, JSON.stringify(order.customer), JSON.stringify(order.items),
      order.subtotal, order.shipping, order.total, order.currency,
    ],
  );
}

export async function getOrder(id: string) {
  const [rows] = await getDatabase().execute<OrderRow[]>("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function getOrderByCheckoutKey(checkoutKey: string) {
  const [rows] = await getDatabase().execute<OrderRow[]>(
    "SELECT * FROM orders WHERE checkout_key = ? LIMIT 1", [checkoutKey],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export type OrderListOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: OrderStatus | "all" | "active";
};

export async function listOrders(options: OrderListOptions = {}) {
  const pageSize = Math.min(100, Math.max(10, options.pageSize ?? 25));
  const page = Math.max(1, options.page ?? 1);
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (options.status === "active") {
    conditions.push("status NOT IN ('expired', 'cancelled')");
  } else if (options.status && options.status !== "all") {
    conditions.push("status = ?");
    values.push(options.status);
  }
  const query = options.query?.trim().slice(0, 120);
  if (query) {
    const like = `%${query}%`;
    conditions.push("(id LIKE ? OR capture_id LIKE ? OR CAST(customer AS CHAR) LIKE ?)");
    values.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [countRows] = await getDatabase().execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM orders ${where}`, values,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * pageSize;
  const [rows] = await getDatabase().execute<OrderRow[]>(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, pageSize, offset],
  );
  return { orders: rows.map(fromRow), total, page: currentPage, pageSize, pages };
}

const ADMIN_STATUS_CHANGES: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["cancelled"],
  payment_failed: ["cancelled"],
  paid: ["processing", "shipped"],
  processing: ["shipped"],
  shipped: ["completed"],
};

export function adminStatusChanges(order: StoredOrder): readonly OrderStatus[] {
  if (["pending", "payment_failed"].includes(order.status) && (order.captureId || order.paidAt || order.paymentStatus === "COMPLETED")) return [];
  if (["paid", "processing", "shipped"].includes(order.status) && !isPaidOrder(order)) return [];
  return ADMIN_STATUS_CHANGES[order.status] ?? [];
}

export async function advanceOrderStatus(id: string, requestedStatus: OrderStatus, trackingNumber?: string) {
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (!adminStatusChanges(order).includes(requestedStatus)) {
    throw new Error(`Order cannot move from ${order.status} to ${requestedStatus}.`);
  }
  if (requestedStatus === "shipped" && !trackingNumber?.trim()) {
    throw new Error("Enter a tracking number before marking this order shipped.");
  }
  let result: ResultSetHeader;
  if (requestedStatus === "shipped") {
    [result] = await getDatabase().execute<ResultSetHeader>(
      "UPDATE orders SET status = ?, tracking_number = ? WHERE id = ? AND status = ?",
      [requestedStatus, trackingNumber!.trim().slice(0, 120), id, order.status],
    );
  } else if (requestedStatus === "completed") {
    [result] = await getDatabase().execute<ResultSetHeader>(
      "UPDATE orders SET status = ?, fulfilled_at = UTC_TIMESTAMP(3) WHERE id = ? AND status = ?",
      [requestedStatus, id, order.status],
    );
  } else if (requestedStatus === "cancelled") {
    [result] = await getDatabase().execute<ResultSetHeader>(
      `UPDATE orders SET status = 'cancelled'
       WHERE id = ? AND status = ? AND capture_id IS NULL AND paid_at IS NULL AND payment_status <> 'COMPLETED'`,
      [id, order.status],
    );
  } else {
    [result] = await getDatabase().execute<ResultSetHeader>(
      "UPDATE orders SET status = ? WHERE id = ? AND status = ?",
      [requestedStatus, id, order.status],
    );
  }
  if (result.affectedRows !== 1) throw new Error("Order changed while it was being updated. Refresh and try again.");
}

export async function cleanupAbandonedOrders() {
  const [deleted] = await getDatabase().execute<ResultSetHeader>(
    `DELETE FROM orders WHERE status = 'expired' AND created_at < UTC_TIMESTAMP(3) - INTERVAL 90 DAY`,
  );
  return { deleted: deleted.affectedRows };
}

export async function expireVerifiedAbandonedOrder(id: string) {
  const [result] = await getDatabase().execute<ResultSetHeader>(
    `UPDATE orders SET status = 'expired', payment_status = 'EXPIRED'
     WHERE id = ? AND status = 'pending' AND created_at < UTC_TIMESTAMP(3) - INTERVAL 24 HOUR`,
    [id],
  );
  return result.affectedRows === 1;
}

export async function touchPendingOrder(id: string) {
  await getDatabase().execute(
    "UPDATE orders SET updated_at = UTC_TIMESTAMP(3) WHERE id = ? AND status = 'pending'",
    [id],
  );
}

export async function pendingOrdersForReconciliation(limit = 50) {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const [rows] = await getDatabase().execute<OrderRow[]>(
    `SELECT * FROM orders WHERE status = 'pending'
     ORDER BY updated_at ASC, created_at ASC LIMIT ?`, [safeLimit],
  );
  return rows.map(fromRow);
}
