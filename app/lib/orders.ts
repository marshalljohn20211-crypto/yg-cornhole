import "server-only";

import type { RowDataPacket } from "mysql2";
import { databaseUrl, getDatabase } from "./database";
import type { ShippingDetails } from "./order-details";

export type StoredOrder = {
  id: string;
  captureId?: string;
  status: "pending" | "paid";
  paymentStatus: string;
  createdAt: string;
  paidAt?: string;
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
  capture_id: string | null;
  status: "pending" | "paid";
  payment_status: string;
  created_at: Date;
  paid_at: Date | null;
  customer: ShippingDetails | string;
  items: StoredOrder["items"] | string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
};

function jsonValue<T>(value: T | string): T {
  return typeof value === "string" ? JSON.parse(value) as T : value;
}

function fromRow(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    ...(row.capture_id ? { captureId: row.capture_id } : {}),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at.toISOString(),
    ...(row.paid_at ? { paidAt: row.paid_at.toISOString() } : {}),
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

export async function saveOrder(order: StoredOrder) {
  await getDatabase().execute(
    `INSERT INTO orders (
      id, capture_id, status, payment_status, created_at, paid_at,
      customer, items, subtotal, shipping, total, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      capture_id = VALUES(capture_id),
      status = VALUES(status),
      payment_status = VALUES(payment_status),
      paid_at = VALUES(paid_at),
      customer = VALUES(customer),
      items = VALUES(items),
      subtotal = VALUES(subtotal),
      shipping = VALUES(shipping),
      total = VALUES(total),
      currency = VALUES(currency)`,
    [
      order.id,
      order.captureId ?? null,
      order.status,
      order.paymentStatus,
      new Date(order.createdAt),
      order.paidAt ? new Date(order.paidAt) : null,
      JSON.stringify(order.customer),
      JSON.stringify(order.items),
      order.subtotal,
      order.shipping,
      order.total,
      order.currency,
    ],
  );
}

export async function getOrder(id: string) {
  const [rows] = await getDatabase().execute<OrderRow[]>("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function listOrders() {
  const [rows] = await getDatabase().query<OrderRow[]>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
  return rows.map(fromRow);
}
