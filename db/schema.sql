CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  checkout_key CHAR(36) NULL,
  checkout_fingerprint CHAR(64) NULL,
  capture_id VARCHAR(32) NULL,
  status ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded', 'expired', 'payment_failed') NOT NULL,
  payment_status VARCHAR(40) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  paid_at DATETIME(3) NULL,
  fulfilled_at DATETIME(3) NULL,
  tracking_number VARCHAR(120) NULL,
  customer JSON NOT NULL,
  items JSON NOT NULL,
  subtotal INT UNSIGNED NOT NULL,
  shipping INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  UNIQUE KEY orders_checkout_key_uq (checkout_key),
  INDEX orders_created_at_idx (created_at DESC),
  INDEX orders_status_created_at_idx (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paypal_webhook_events (
  event_id VARCHAR(64) NOT NULL PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  order_id VARCHAR(32) NULL,
  processed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX paypal_webhook_order_idx (order_id, processed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  username VARCHAR(80) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  password_hash CHAR(128) NOT NULL,
  password_salt CHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
