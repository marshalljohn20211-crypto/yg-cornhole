import { getBrowserSafeClientToken, PayPalRequestError } from "../../../lib/paypal";

export async function GET() {
  try {
    const clientToken = await getBrowserSafeClientToken();
    return Response.json(
      { clientToken },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    const status = error instanceof PayPalRequestError ? error.status : 500;
    const code = error instanceof PayPalRequestError ? error.code : "PAYPAL_CLIENT_TOKEN_FAILED";
    const message = error instanceof Error
      ? error.message
      : "PayPal could not initialize card payments.";

    return Response.json(
      { error: message, code },
      { status, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
