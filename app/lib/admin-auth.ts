import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { databaseUrl, getDatabase } from "./database";

const COOKIE_NAME = "yg_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function sessionConfig() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  try {
    databaseUrl();
  } catch {
    return null;
  }
  return { secret };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdminConfigured() {
  return sessionConfig() !== null;
}

type AdminRow = RowDataPacket & {
  password_hash: string;
  password_salt: string;
};

export async function verifyAdminCredentials(usernameValue: string, password: string) {
  const username = usernameValue.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,80}$/.test(username) || !password || password.length > 200) return false;
  const [rows] = await getDatabase().execute<AdminRow[]>(
    "SELECT password_hash, password_salt FROM admin_users WHERE username = ? AND is_active = 1 LIMIT 1",
    [username],
  );
  const admin = rows[0];
  if (!admin) return false;
  const derived = scryptSync(password, Buffer.from(admin.password_salt, "hex"), 64).toString("hex");
  return safeEqual(derived, admin.password_hash);
}

export function createAdminSession() {
  const config = sessionConfig();
  if (!config) throw new Error("Admin authentication is not configured.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${signature(payload, config.secret)}`;
}

export function verifyAdminSession(value: string | undefined) {
  const config = sessionConfig();
  if (!config || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = Number(parts[1]);
  if (!Number.isInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  return safeEqual(parts[2], signature(payload, config.secret));
}

export async function isAdminAuthenticated() {
  return verifyAdminSession((await cookies()).get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
};
