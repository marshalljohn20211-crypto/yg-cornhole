import { getOrder, isPaidOrder } from "../../../../lib/orders";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { renderReceiptHtml, verifyReceiptToken } from "../../../../lib/receipt";

function validOrderId(orderId: string) {
  return /^[A-Z0-9]{8,32}$/i.test(orderId);
}

function receiptResponse(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>, download: boolean) {
  const disposition = download ? "attachment" : "inline";
  return new Response(renderReceiptHtml(order), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `${disposition}; filename="YG-Cornhole-receipt-${order.id}.html"`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; frame-ancestors 'none'",
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function paidOrder(orderId: string) {
  const order = await getOrder(orderId);
  return order && isPaidOrder(order) ? order : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!validOrderId(orderId)) return new Response("Invalid order reference.", { status: 400 });
  if (!await isAdminAuthenticated()) return new Response("Administrator sign-in required.", { status: 401 });
  const order = await paidOrder(orderId);
  if (!order) return new Response("A paid receipt is not available for this order.", { status: 409 });
  return receiptResponse(order, new URL(request.url).searchParams.get("download") === "1");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!validOrderId(orderId)) {
    return Response.json({ error: "The order reference is invalid." }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as { receiptToken?: unknown; download?: unknown } | null;
  if (!verifyReceiptToken(orderId, body?.receiptToken)) {
    return Response.json({ error: "This receipt link is invalid or incomplete." }, { status: 403 });
  }

  const order = await paidOrder(orderId);
  if (!order) {
    return Response.json({ error: "A paid receipt is not available for this order." }, { status: 409 });
  }

  return receiptResponse(order, body?.download !== false);
}
