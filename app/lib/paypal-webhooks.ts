import "server-only";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDatabase } from "./database";

export type PayPalWebhookEvent = {
  id?: unknown;
  event_type?: unknown;
  resource?: {
    id?: unknown;
    status?: unknown;
    amount?: { currency_code?: unknown; value?: unknown };
    supplementary_data?: {
      related_ids?: { order_id?: unknown; capture_id?: unknown };
    };
  };
};

type LockedOrder = RowDataPacket & {
  id: string;
  status: string;
  total: number;
  currency: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function cents(value: unknown) {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

export async function processVerifiedPayPalWebhook(event: PayPalWebhookEvent) {
  const eventId = text(event.id);
  const eventType = text(event.event_type);
  if (!eventId || !eventType || eventId.length > 64 || eventType.length > 80) {
    throw new Error("PayPal sent an invalid webhook event.");
  }

  const resource = event.resource;
  const related = resource?.supplementary_data?.related_ids;
  let orderId = text(related?.order_id);
  const captureId = eventType === "PAYMENT.CAPTURE.REFUNDED"
    ? text(related?.capture_id)
    : eventType.startsWith("PAYMENT.CAPTURE.") ? text(resource?.id) : text(related?.capture_id);
  if (!orderId && eventType.startsWith("CHECKOUT.")) orderId = text(resource?.id);

  const connection = await getDatabase().getConnection();
  try {
    await connection.beginTransaction();
    const [insert] = await connection.execute<ResultSetHeader>(
      "INSERT IGNORE INTO paypal_webhook_events (event_id, event_type, order_id) VALUES (?, ?, ?)",
      [eventId, eventType, orderId ?? null],
    );
    if (insert.affectedRows === 0) {
      await connection.commit();
      return { duplicate: true, updated: false };
    }

    let rows: LockedOrder[];
    if (orderId) {
      [rows] = await connection.execute<LockedOrder[]>(
        "SELECT id, status, total, currency FROM orders WHERE id = ? LIMIT 1 FOR UPDATE",
        [orderId],
      );
    } else if (captureId) {
      [rows] = await connection.execute<LockedOrder[]>(
        "SELECT id, status, total, currency FROM orders WHERE capture_id = ? LIMIT 1 FOR UPDATE",
        [captureId],
      );
      orderId = rows[0]?.id;
    } else {
      rows = [];
    }

    const order = rows[0];
    const recognized = new Set([
      "CHECKOUT.ORDER.APPROVED",
      "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
      "PAYMENT.CAPTURE.PENDING",
      "PAYMENT.CAPTURE.COMPLETED",
      "PAYMENT.CAPTURE.DENIED",
      "PAYMENT.CAPTURE.REFUNDED",
    ]);
    if (recognized.has(eventType) && !order) {
      throw new Error(`Webhook ${eventType} could not be matched to a stored order.`);
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && order && orderId && captureId) {
      const amount = cents(resource?.amount?.value);
      const currency = text(resource?.amount?.currency_code);
      if (amount !== order.total || currency !== order.currency) {
        throw new Error("PayPal webhook amount did not match the stored order total.");
      }
      await connection.execute(
        `UPDATE orders SET capture_id = ?,
          status = CASE WHEN status IN ('processing', 'shipped', 'completed', 'refunded') THEN status ELSE 'paid' END,
          payment_status = 'COMPLETED',
          paid_at = COALESCE(paid_at, UTC_TIMESTAMP(3)) WHERE id = ?`,
        [captureId, orderId],
      );
    } else if (eventType === "PAYMENT.CAPTURE.PENDING" && orderId) {
      await connection.execute("UPDATE orders SET payment_status = 'PENDING' WHERE id = ? AND status = 'pending'", [orderId]);
    } else if (eventType === "CHECKOUT.ORDER.APPROVED" && orderId) {
      await connection.execute("UPDATE orders SET payment_status = 'APPROVED' WHERE id = ? AND status = 'pending'", [orderId]);
    } else if ((eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "CHECKOUT.PAYMENT-APPROVAL.REVERSED") && orderId) {
      await connection.execute(
        "UPDATE orders SET status = 'payment_failed', payment_status = ? WHERE id = ? AND status = 'pending'",
        [eventType === "PAYMENT.CAPTURE.DENIED" ? "DENIED" : "APPROVAL_REVERSED", orderId],
      );
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED" && orderId) {
      await connection.execute("UPDATE orders SET status = 'refunded', payment_status = 'REFUNDED' WHERE id = ?", [orderId]);
    }

    await connection.execute("UPDATE paypal_webhook_events SET order_id = ? WHERE event_id = ?", [orderId ?? null, eventId]);
    await connection.commit();
    return { duplicate: false, updated: Boolean(order && recognized.has(eventType)) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
