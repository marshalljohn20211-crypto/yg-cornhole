import { createHash } from "node:crypto";
import { cents, priceCheckout } from "../../../lib/checkout";
import { cleanShipping } from "../../../lib/order-details";
import { assertOrderStorageConfigured, getOrderByCheckoutKey, saveOrder } from "../../../lib/orders";
import { PayPalRequestError, paypalRequest } from "../../../lib/paypal";
import { assertReceiptSigningConfigured, createReceiptToken } from "../../../lib/receipt";

type CreatedOrder = { id: string; status: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: unknown; shipping?: unknown; checkoutAttemptId?: unknown };
    if (typeof body.checkoutAttemptId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.checkoutAttemptId)) {
      return Response.json({ error: "The checkout attempt is invalid.", code: "CHECKOUT_ATTEMPT_INVALID" }, { status: 400 });
    }
    const cart = priceCheckout(body.items);
    const shipping = cleanShipping(body.shipping);
    assertOrderStorageConfigured();
    assertReceiptSigningConfigured();
    const fingerprint = createHash("sha256").update(JSON.stringify({ lines: cart.lines, shipping })).digest("hex");
    const existing = await getOrderByCheckoutKey(body.checkoutAttemptId);
    if (existing) {
      if (existing.checkoutFingerprint !== fingerprint) {
        return Response.json({ error: "Checkout details changed. Start the payment again.", code: "CHECKOUT_ATTEMPT_CHANGED" }, { status: 409 });
      }
      if (existing.status === "pending") {
        return Response.json({ id: existing.id, receiptToken: createReceiptToken(existing.id), reused: true });
      }
      return Response.json({ error: "This checkout attempt has already finished.", code: "CHECKOUT_ATTEMPT_FINISHED" }, { status: 409 });
    }
    const order = await paypalRequest<CreatedOrder>("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": body.checkoutAttemptId },
      body: JSON.stringify({
        intent: "CAPTURE",
        payer: { email_address: shipping.email },
        purchase_units: [{
          description: "YG Cornhole order",
          amount: {
            currency_code: "USD",
            value: cents(cart.total),
            breakdown: {
              item_total: { currency_code: "USD", value: cents(cart.subtotal) },
              shipping: { currency_code: "USD", value: cents(cart.shipping) },
            },
          },
          items: cart.lines.map((line) => ({
            name: line.name.slice(0, 127),
            description: `${line.size} / ${line.color}`.slice(0, 127),
            sku: line.slug.slice(0, 127),
            category: "PHYSICAL_GOODS",
            quantity: String(line.quantity),
            unit_amount: { currency_code: "USD", value: cents(line.unitAmount) },
          })),
          shipping: {
            name: { full_name: shipping.fullName },
            address: {
              address_line_1: shipping.addressLine1,
              ...(shipping.addressLine2 ? { address_line_2: shipping.addressLine2 } : {}),
              admin_area_2: shipping.city,
              admin_area_1: shipping.state,
              postal_code: shipping.postalCode,
              country_code: shipping.countryCode,
            },
          },
        }],
      }),
    });

    await saveOrder({
      id: order.id,
      checkoutKey: body.checkoutAttemptId,
      checkoutFingerprint: fingerprint,
      status: "pending",
      paymentStatus: order.status,
      createdAt: new Date().toISOString(),
      customer: shipping,
      items: cart.lines,
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
      currency: "USD",
    });

    return Response.json({ id: order.id, receiptToken: createReceiptToken(order.id) });
  } catch (error) {
    const status = error instanceof PayPalRequestError ? error.status : 400;
    const message = error instanceof Error ? error.message : "The PayPal order could not be created.";
    const code = error instanceof PayPalRequestError ? error.code : "CHECKOUT_DETAILS_INVALID";
    return Response.json({ error: message, code }, { status });
  }
}
