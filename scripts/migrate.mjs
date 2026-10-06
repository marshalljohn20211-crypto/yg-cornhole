import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import mysql from "mysql2/promise";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "db", "migrations");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectRoot);

function databaseOptions() {
  if (process.env.DATABASE_URL) return { uri: process.env.DATABASE_URL, multipleStatements: true };
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = Number(process.env.DB_PORT ?? "3306");
  if (!host || !database || !user || password === undefined || !Number.isInteger(port)) {
    throw new Error("Database settings are missing. Set DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.");
  }
  return { host, port, database, user, password, multipleStatements: true };
}

async function migrationFiles() {
  return (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function checksum(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1",
    [table],
  );
  return rows.length === 1;
}

async function hasColumns(connection, table, columns) {
  const [rows] = await connection.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
    [table],
  );
  const found = new Set(rows.map((row) => row.column_name));
  return columns.every((column) => found.has(column));
}

async function legacyMigrationAlreadyPresent(connection, name) {
  if (name === "2026-09-22-initial-schema.sql") {
    return await tableExists(connection, "orders") && await tableExists(connection, "admin_users");
  }
  if (name === "2026-09-23-order-reliability.sql") {
    return await tableExists(connection, "orders")
      && await hasColumns(connection, "orders", ["checkout_key", "checkout_fingerprint", "updated_at", "fulfilled_at", "tracking_number"])
      && await tableExists(connection, "paypal_webhook_events");
  }
  if (name === "2026-09-26-catalog-cms.sql") {
    return (await Promise.all(["catalog_categories", "catalog_products", "catalog_media"].map((table) => tableExists(connection, table)))).every(Boolean);
  }
  if (name === "2026-10-07-catalog-subcategories.sql") {
    return tableExists(connection, "catalog_subcategories");
  }
  return false;
}

async function ensureHistoryTable(connection) {
  if (await tableExists(connection, "app_migrations")) return;
  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      batch INT UNSIGNED NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX app_migrations_batch_idx (batch, applied_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function appliedMigrations(connection) {
  const [rows] = await connection.query("SELECT name, checksum, batch, applied_at FROM app_migrations ORDER BY name");
  return new Map(rows.map((row) => [row.name, row]));
}

async function baselineLegacyMigrations(connection, files, applied) {
  const latestBatch = Math.max(0, ...[...applied.values()].map((row) => Number(row.batch)));
  for (const name of files) {
    if (applied.has(name) || !await legacyMigrationAlreadyPresent(connection, name)) continue;
    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    await connection.execute(
      "INSERT INTO app_migrations (name, checksum, batch) VALUES (?, ?, ?)",
      [name, checksum(sql), latestBatch],
    );
    applied.set(name, { name, checksum: checksum(sql), batch: latestBatch });
    console.log(`BASELINED  ${name} (already present)`);
  }
}

async function printStatus(connection, files, applied) {
  console.log("\nMigration status\n");
  for (const name of files) {
    const row = applied.get(name);
    console.log(`${row ? "[applied]" : "[pending]"} ${name}${row ? `  batch ${row.batch}` : ""}`);
  }
}

async function main() {
  const command = process.argv[2] ?? "migrate";
  if (!new Set(["migrate", "status"]).has(command)) throw new Error(`Unknown command: ${command}. Use migrate or status.`);

  const connection = await mysql.createConnection(databaseOptions());
  let lockAcquired = false;
  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK('yg_cornhole_migrations', 10) AS acquired");
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) throw new Error("Another migration process is running. Try again shortly.");

    await ensureHistoryTable(connection);
    const files = await migrationFiles();
    const applied = await appliedMigrations(connection);
    await baselineLegacyMigrations(connection, files, applied);

    for (const name of files) {
      const recorded = applied.get(name);
      if (!recorded) continue;
      const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
      if (recorded.checksum !== checksum(sql)) console.warn(`WARNING     ${name} changed after it was recorded as applied.`);
    }

    if (command === "status") {
      await printStatus(connection, files, applied);
      return;
    }

    const pending = files.filter((name) => !applied.has(name));
    if (!pending.length) {
      console.log("Nothing to migrate. Database is up to date.");
      return;
    }

    const nextBatch = Math.max(0, ...[...applied.values()].map((row) => Number(row.batch))) + 1;
    for (const name of pending) {
      const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
      if (!sql.trim()) throw new Error(`${name} is empty.`);
      process.stdout.write(`RUNNING     ${name} ... `);
      await connection.query(sql);
      await connection.execute(
        "INSERT INTO app_migrations (name, checksum, batch) VALUES (?, ?, ?)",
        [name, checksum(sql), nextBatch],
      );
      console.log("DONE");
    }
    console.log(`Applied ${pending.length} migration${pending.length === 1 ? "" : "s"} in batch ${nextBatch}.`);
  } finally {
    if (lockAcquired) await connection.query("SELECT RELEASE_LOCK('yg_cornhole_migrations')");
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
