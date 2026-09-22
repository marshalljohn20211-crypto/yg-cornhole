import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function receiptSecret() {
  const configured = process.env.RECEIPT_SECRET;
  if (configured !== undefined) {
    if (configured.length < 32) {
      throw new Error("RECEIPT_SECRET must contain at least 32 characters.");
    }
    return configured;
  }

  const fallback = process.env.ADMIN_SESSION_SECRET ?? process.env.PAYPAL_CLIENT_SECRET;
  if (!fallback) throw new Error("Receipt downloads are not configured.");
  return fallback;
}

export function assertReceiptSigningConfigured() {
  receiptSecret();
}

export function createReceiptToken(orderId: string) {
  return createHmac("sha256", receiptSecret())
    .update(`yg-cornhole-receipt:${orderId}`)
    .digest("base64url");
}

export function verifyReceiptToken(orderId: string, token: unknown) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const expected = Buffer.from(createReceiptToken(orderId));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
