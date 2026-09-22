import { processVerifiedPayPalWebhook, type PayPalWebhookEvent } from "../../../lib/paypal-webhooks";
import { PayPalRequestError, verifyPayPalWebhook } from "../../../lib/paypal";

class WebhookInputError extends Error {}

function requiredHeader(request: Request, name: string) {
  const value = request.headers.get(name);
  if (!value) throw new WebhookInputError(`Missing ${name} header.`);
  return value;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    const verified = await verifyPayPalWebhook({
      authAlgo: requiredHeader(request, "paypal-auth-algo"),
      certUrl: requiredHeader(request, "paypal-cert-url"),
      transmissionId: requiredHeader(request, "paypal-transmission-id"),
      transmissionSig: requiredHeader(request, "paypal-transmission-sig"),
      transmissionTime: requiredHeader(request, "paypal-transmission-time"),
    }, event);
    if (!verified) return Response.json({ error: "Invalid PayPal webhook signature." }, { status: 403 });

    const result = await processVerifiedPayPalWebhook(event);
    return Response.json({ received: true, ...result });
  } catch (error) {
    const status = error instanceof SyntaxError || error instanceof WebhookInputError
      ? 400
      : error instanceof PayPalRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "The PayPal webhook could not be processed.";
    return Response.json({ error: message }, { status });
  }
}
