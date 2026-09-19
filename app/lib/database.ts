import "server-only";

import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

export function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value || !/^mysql:\/\//i.test(value)) {
    throw new Error("MySQL order storage is not configured.");
  }
  return value;
}

export function getDatabase() {
  if (!pool) {
    pool = mysql.createPool({
      uri: databaseUrl(),
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      idleTimeout: 30_000,
      enableKeepAlive: true,
      timezone: "Z",
    });
  }
  return pool;
}
