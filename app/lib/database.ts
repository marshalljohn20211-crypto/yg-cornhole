import "server-only";

import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | undefined;

type DatabaseConfig =
  | { type: "url"; url: string }
  | {
      type: "fields";
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };

function databaseConfig(): DatabaseConfig {
  const value = process.env.DATABASE_URL;
  if (value) {
    if (!/^mysql:\/\//i.test(value)) {
      throw new Error("MySQL order storage is not configured.");
    }
    return { type: "url", url: value };
  }

  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const port = Number(process.env.DB_PORT ?? "3306");

  if (!host || !database || !user || !password || !Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("MySQL order storage is not configured.");
  }

  return { type: "fields", host, port, database, user, password };
}

export function databaseUrl() {
  const config = databaseConfig();
  if (config.type === "url") return config.url;

  return `mysql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${encodeURIComponent(config.database)}`;
}

export function getDatabase() {
  if (!pool) {
    const config = databaseConfig();
    const sharedOptions = {
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      idleTimeout: 30_000,
      enableKeepAlive: true,
      timezone: "Z",
    } as const;

    pool = config.type === "url"
      ? mysql.createPool({ uri: config.url, ...sharedOptions })
      : mysql.createPool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
          ...sharedOptions,
        });
  }
  return pool;
}
