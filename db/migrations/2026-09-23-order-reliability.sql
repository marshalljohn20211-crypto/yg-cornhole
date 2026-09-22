ALTER TABLE orders
  ADD COLUMN checkout_key CHAR(36) NULL AFTER id,
  ADD COLUMN checkout_fingerprint CHAR(64) NULL AFTER checkout_key,
  MODIFY COLUMN status ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'expired', 'payment_failed') NOT NULL,
  ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at,
  ADD COLUMN fulfilled_at DATETIME(3) NULL AFTER paid_at,
  ADD COLUMN tracking_number VARCHAR(120) NULL AFTER fulfilled_at,
  ADD UNIQUE KEY orders_checkout_key_uq (checkout_key),
  ADD INDEX orders_status_created_at_idx (status, created_at DESC);

CREATE TABLE IF NOT EXISTS paypal_webhook_events (
  event_id VARCHAR(64) NOT NULL PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  order_id VARCHAR(32) NULL,
  processed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX paypal_webhook_order_idx (order_id, processed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
