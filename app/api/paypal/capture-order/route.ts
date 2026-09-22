import { PayPalRequestError, paypalRequest } from "../../../lib/paypal";
import { getOrder, saveOrder } from "../../../lib/orders";
import { verifyReceiptToken } from "../../../lib/receipt";

type CapturedOrder = {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string }> };
  }>;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { orderId?: unknown; receiptToken?: unknown };
    if (typeof body.orderId !== "string" || !/^[A-Z0-9]{8,32}$/i.test(body.orderId)) {
      return Response.json({ error: "The PayPal order ID is invalid." }, { status: 400 });
    }
    if (!verifyReceiptToken(body.orderId, body.receiptToken)) {
      return Response.json({ error: "The checkout session is invalid or incomplete." }, { status: 403 });
    }

    const storedOrder = await getOrder(body.orderId);
    if (!storedOrder) {
      return Response.json({ error: "The checkout record could not be found before payment." }, { status: 409 });
    }

    const order = await paypalRequest<CapturedOrder>(`/v2/checkout/orders/${encodeURIComponent(body.orderId)}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `capture-${body.orderId}` },
      body: "{}",
    });
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

    if (order.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return Response.json({ error: "PayPal has not completed this payment." }, { status: 409 });
    }

    if (order.id !== storedOrder.id) {
      return Response.json({ error: "The paid order did not match its checkout record." }, { status: 409 });
    }
    await saveOrder({
      ...storedOrder,
      captureId: capture.id,
      status: "paid",
      paymentStatus: order.status,
      paidAt: new Date().toISOString(),
    });

    return Response.json({ id: order.id, status: order.status, captureId: capture.id });
  } catch (error) {
    const status = error instanceof PayPalRequestError ? error.status : 400;
    const message = error instanceof Error ? error.message : "The PayPal payment could not be captured.";
    return Response.json({ error: message }, { status });
  }
}
