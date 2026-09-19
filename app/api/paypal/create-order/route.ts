import { cents, priceCheckout } from "../../../lib/checkout";
import { cleanShipping } from "../../../lib/order-details";
import { assertOrderStorageConfigured, saveOrder } from "../../../lib/orders";
import { PayPalRequestError, paypalRequest } from "../../../lib/paypal";

type CreatedOrder = { id: string; status: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: unknown; shipping?: unknown };
    const cart = priceCheckout(body.items);
    const shipping = cleanShipping(body.shipping);
    assertOrderStorageConfigured();
    const order = await paypalRequest<CreatedOrder>("/v2/checkout/orders", {
      method: "POST",
      headers: { "PayPal-Request-Id": crypto.randomUUID() },
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

    return Response.json({ id: order.id });
  } catch (error) {
    const status = error instanceof PayPalRequestError ? error.status : 400;
    const message = error instanceof Error ? error.message : "The PayPal order could not be created.";
    const code = error instanceof PayPalRequestError ? error.code : "CHECKOUT_DETAILS_INVALID";
    return Response.json({ error: message, code }, { status });
  }
}
