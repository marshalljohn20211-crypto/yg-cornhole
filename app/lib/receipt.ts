import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { StoredOrder } from "./orders";

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function receiptDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function renderReceiptHtml(order: StoredOrder) {
  const country = order.customer.countryCode === "US" ? "United States" : "Canada";
  const address = [
    order.customer.addressLine1,
    order.customer.addressLine2,
    `${order.customer.city}, ${order.customer.state} ${order.customer.postalCode}`,
    country,
  ].filter(Boolean).map((line) => escapeHtml(line)).join("<br>");
  const rows = order.items.map((item) => {
    const options = Object.entries(item.options ?? {})
      .map(([name, value]) => `${name}: ${value}`)
      .join(" · ");
    const details = [item.size, item.color, options].filter(Boolean).map(escapeHtml).join(" · ");
    return `<tr>
      <td><strong>${escapeHtml(item.name)}</strong><span>${details}</span></td>
      <td class="number">${item.quantity}</td>
      <td class="number">${money(item.unitAmount)}</td>
      <td class="number"><strong>${money(item.unitAmount * item.quantity)}</strong></td>
    </tr>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>YG Cornhole receipt ${escapeHtml(order.id)}</title>
  <style>
    :root{color-scheme:light;--ink:#0d1924;--red:#a73136;--blue:#234c69;--paper:#fff;--mist:#eef1f3;--muted:#64717c}
    *{box-sizing:border-box}body{margin:0;padding:34px;background:var(--mist);color:var(--ink);font-family:Arial,Helvetica,sans-serif}
    .receipt{width:min(860px,100%);margin:auto;background:var(--paper);box-shadow:0 24px 70px rgba(13,25,36,.14);border-top:8px solid var(--red)}
    header{padding:34px 40px 28px;display:flex;align-items:flex-start;justify-content:space-between;gap:28px;background:var(--ink);color:#fff}
    .brand{display:flex;align-items:center;gap:15px}.mark{width:55px;height:55px;display:grid;place-items:center;background:var(--red);font:900 23px Impact,Arial Narrow,sans-serif;clip-path:polygon(0 0,100% 0,86% 100%,0 100%)}
    .brand small,.eyebrow{display:block;color:#e77d80;font:700 9px Consolas,monospace;letter-spacing:.13em;text-transform:uppercase}.brand h1{margin:3px 0 0;font:900 30px Impact,Arial Narrow,sans-serif;letter-spacing:.03em;text-transform:uppercase}
    .receipt-title{text-align:right}.receipt-title h2{margin:4px 0 8px;font:900 38px Impact,Arial Narrow,sans-serif;text-transform:uppercase}.paid{display:inline-block;padding:6px 9px;background:#dcefe9;color:#24564c;font:800 9px Consolas,monospace;text-transform:uppercase}
    main{padding:34px 40px 42px}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding-bottom:25px;border-bottom:1px solid #d7dde1}.meta div,.card{min-width:0}.label{display:block;margin-bottom:6px;color:var(--muted);font:700 9px Consolas,monospace;text-transform:uppercase}.value{font-size:12px;overflow-wrap:anywhere}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:25px 0}.card{padding:20px;background:#f5f7f8;border-left:4px solid var(--blue)}.card h3,.items h3{margin:0 0 14px;font:900 22px Impact,Arial Narrow,sans-serif;text-transform:uppercase}.card p,.card address{margin:0;font-size:12px;line-height:1.75;font-style:normal}.card p+p{margin-top:10px}
    table{width:100%;border-collapse:collapse;font-size:12px}th{padding:10px 8px;border-bottom:2px solid var(--ink);color:var(--muted);font:700 9px Consolas,monospace;text-align:left;text-transform:uppercase}td{padding:15px 8px;border-bottom:1px solid #dfe4e7;vertical-align:top}td span{display:block;margin-top:5px;color:var(--muted);font-size:10px}.number{text-align:right;white-space:nowrap}
    .totals{width:min(330px,100%);margin:20px 0 0 auto}.totals div{padding:7px 0;display:flex;justify-content:space-between;gap:20px;font-size:12px}.totals .grand{margin-top:7px;padding-top:13px;border-top:2px solid var(--ink);font-size:16px;font-weight:800}
    footer{padding:23px 40px;background:var(--ink);color:#c0cad1;display:flex;justify-content:space-between;gap:20px;font-size:10px;line-height:1.6}footer strong{color:#fff;text-transform:uppercase}
    @media(max-width:650px){body{padding:0}.receipt{box-shadow:none}header,main,footer{padding-left:22px;padding-right:22px}.receipt-title h2{font-size:29px}.meta{grid-template-columns:1fr}.cards{grid-template-columns:1fr}th:nth-child(3),td:nth-child(3){display:none}footer{flex-direction:column}}
    @media print{body{padding:0;background:#fff}.receipt{width:100%;box-shadow:none}@page{margin:12mm}}
  </style>
</head>
<body>
  <article class="receipt">
    <header>
      <div class="brand"><div class="mark">YG</div><div><small>Competition gear</small><h1>YG Cornhole</h1></div></div>
      <div class="receipt-title"><span class="eyebrow">Customer copy</span><h2>Payment receipt</h2><span class="paid">Paid in full</span></div>
    </header>
    <main>
      <section class="meta">
        <div><span class="label">Order reference</span><span class="value">${escapeHtml(order.id)}</span></div>
        <div><span class="label">PayPal capture</span><span class="value">${escapeHtml(order.captureId)}</span></div>
        <div><span class="label">Payment date</span><span class="value">${escapeHtml(receiptDate(order.paidAt!))} UTC</span></div>
      </section>
      <section class="cards">
        <div class="card"><h3>Customer</h3><p><strong>${escapeHtml(order.customer.fullName)}</strong><br>${escapeHtml(order.customer.email)}<br>${escapeHtml(order.customer.phone)}</p></div>
        <div class="card"><h3>Deliver to</h3><address>${address}</address>${order.customer.deliveryNotes ? `<p><span class="label">Delivery notes</span>${escapeHtml(order.customer.deliveryNotes)}</p>` : ""}</div>
      </section>
      <section class="items"><h3>Order details</h3><table><thead><tr><th>Item</th><th class="number">Qty</th><th class="number">Unit price</th><th class="number">Amount</th></tr></thead><tbody>${rows}</tbody></table></section>
      <section class="totals"><div><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div><div><span>Shipping</span><strong>${money(order.shipping)}</strong></div><div class="grand"><span>Total paid</span><strong>${money(order.total)}</strong></div></section>
    </main>
    <footer><div><strong>Thank you for your order.</strong><br>Keep this receipt for your records.</div><div>YG Cornhole · ygcornhole.com<br>Built by people who play.</div></footer>
  </article>
</body>
</html>`;
}
