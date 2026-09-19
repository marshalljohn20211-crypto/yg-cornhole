import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "yg_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function credentials() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
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
  return credentials() !== null;
}

export function verifyAdminPassword(value: string) {
  const config = credentials();
  return config ? safeEqual(value, config.password) : false;
}

export function createAdminSession() {
  const config = credentials();
  if (!config) throw new Error("Admin authentication is not configured.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `admin.${expires}`;
  return `${payload}.${signature(payload, config.secret)}`;
}

export function verifyAdminSession(value: string | undefined) {
  const config = credentials();
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
