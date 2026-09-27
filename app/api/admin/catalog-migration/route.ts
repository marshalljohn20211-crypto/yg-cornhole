import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../lib/admin-origin";
import { getDatabase } from "../../../lib/database";

const statements = [
  `CREATE TABLE IF NOT EXISTS catalog_categories (
    slug VARCHAR(80) NOT NULL PRIMARY KEY,
    data JSON NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalog_products (
    slug VARCHAR(120) NOT NULL PRIMARY KEY,
    data JSON NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS catalog_media (
    id CHAR(36) NOT NULL PRIMARY KEY,
    mime VARCHAR(32) NOT NULL,
    content LONGBLOB NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export async function POST(request: NextRequest) {
  if (!adminRequestOrigin(request)) return new NextResponse("Invalid request origin.", { status: 403 });
  if (!await isAdminAuthenticated()) return adminRedirect(request, "/admin/login");

  for (const statement of statements) await getDatabase().execute(statement);
  return adminRedirect(request, "/admin/products?saved=migrated");
}
