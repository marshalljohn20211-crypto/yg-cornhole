import "server-only";

type PayPalEnvironment = "sandbox" | "live";

type PayPalErrorBody = {
  message?: string;
  details?: Array<{ description?: string }>;
};

export class PayPalRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "PAYPAL_REQUEST_FAILED") {
    super(message);
    this.name = "PayPalRequestError";
    this.status = status;
    this.code = code;
  }
}

export function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment: PayPalEnvironment = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";

  if (!clientId || !clientSecret) {
    throw new PayPalRequestError(
      "The PayPal environment variables are missing from this deployment.",
      503,
      "PAYPAL_CONFIG_MISSING",
    );
  }

  return {
    clientId,
    clientSecret,
    environment,
    apiBase: environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  };
}

async function requestOAuthToken(formBody: string) {
  const { clientId, clientSecret, apiBase } = getPayPalConfig();
  const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody,
    cache: "no-store",
  });

  const body = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    const invalidCredentials = body.error === "invalid_client" || response.status === 401;
    throw new PayPalRequestError(
      invalidCredentials ? "PayPal rejected the configured Client ID and Secret." : body.error_description ?? "PayPal authentication failed.",
      invalidCredentials ? 401 : 502,
      invalidCredentials ? "PAYPAL_INVALID_CREDENTIALS" : "PAYPAL_AUTH_FAILED",
    );
  }

  return body.access_token;
}

async function getAccessToken() {
  return requestOAuthToken("grant_type=client_credentials&response_type=token");
}

export async function getBrowserSafeClientToken() {
  return requestOAuthToken(
    "grant_type=client_credentials&response_type=client_token&intent=sdk_init",
  );
}

export async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  const { apiBase } = getPayPalConfig();
  const accessToken = await getAccessToken();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = await response.json() as T & PayPalErrorBody;
  if (!response.ok) {
    const detail = body.details?.[0]?.description;
    throw new PayPalRequestError(detail ?? body.message ?? "PayPal could not process the request.", 502);
  }

  return body;
}

type WebhookHeaders = {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
};

export async function verifyPayPalWebhook(headers: WebhookHeaders, event: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new PayPalRequestError("PAYPAL_WEBHOOK_ID is missing from this deployment.", 503, "PAYPAL_WEBHOOK_CONFIG_MISSING");
  }
  const result = await paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.authAlgo,
        cert_url: headers.certUrl,
        transmission_id: headers.transmissionId,
        transmission_sig: headers.transmissionSig,
        transmission_time: headers.transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    },
  );
  return result.verification_status === "SUCCESS";
}
