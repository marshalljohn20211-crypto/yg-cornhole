-- Additive migration. Existing categories, products, and orders are unchanged.
CREATE TABLE IF NOT EXISTS catalog_subcategories (
  slug VARCHAR(120) NOT NULL PRIMARY KEY,
  data JSON NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
