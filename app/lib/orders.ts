import "server-only";

import { Pool } from "pg";
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

type OrderRow = {
  id: string;
  capture_id: string | null;
  status: "pending" | "paid";
  payment_status: string;
  created_at: Date;
  paid_at: Date | null;
  customer: ShippingDetails;
  items: StoredOrder["items"];
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
};

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("PostgreSQL order storage is not configured.");
  return value;
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ...(process.env.DATABASE_SSL === "require" ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    pool.on("error", (error) => console.error("PostgreSQL order pool error", error));
  }
  return pool;
}

async function ensureSchema() {
  schemaReady ??= getPool().query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      capture_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'paid')),
      payment_status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      paid_at TIMESTAMPTZ,
      customer JSONB NOT NULL,
      items JSONB NOT NULL,
      subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
      shipping INTEGER NOT NULL CHECK (shipping >= 0),
      total INTEGER NOT NULL CHECK (total >= 0),
      currency CHAR(3) NOT NULL DEFAULT 'USD'
    );
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
  `).then(() => undefined);
  return schemaReady;
}

function fromRow(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    ...(row.capture_id ? { captureId: row.capture_id } : {}),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at.toISOString(),
    ...(row.paid_at ? { paidAt: row.paid_at.toISOString() } : {}),
    customer: row.customer,
    items: row.items,
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
  await ensureSchema();
  await getPool().query({
    text: `
      INSERT INTO orders (
        id, capture_id, status, payment_status, created_at, paid_at,
        customer, items, subtotal, shipping, total, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        capture_id = EXCLUDED.capture_id,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        paid_at = EXCLUDED.paid_at,
        customer = EXCLUDED.customer,
        items = EXCLUDED.items,
        subtotal = EXCLUDED.subtotal,
        shipping = EXCLUDED.shipping,
        total = EXCLUDED.total,
        currency = EXCLUDED.currency
    `,
    values: [
      order.id,
      order.captureId ?? null,
      order.status,
      order.paymentStatus,
      order.createdAt,
      order.paidAt ?? null,
      JSON.stringify(order.customer),
      JSON.stringify(order.items),
      order.subtotal,
      order.shipping,
      order.total,
      order.currency,
    ],
  });
}

export async function getOrder(id: string) {
  await ensureSchema();
  const result = await getPool().query<OrderRow>("SELECT * FROM orders WHERE id = $1", [id]);
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

export async function listOrders() {
  await ensureSchema();
  const result = await getPool().query<OrderRow>("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
  return result.rows.map(fromRow);
}
