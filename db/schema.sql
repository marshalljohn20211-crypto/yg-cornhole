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
