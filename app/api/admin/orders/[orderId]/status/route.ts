import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { advanceOrderStatus, ORDER_STATUSES, type OrderStatus } from "../../../../../lib/orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!await isAdminAuthenticated()) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new NextResponse("Invalid request origin.", { status: 403 });

  const { orderId } = await params;
  const form = await request.formData();
  const status = form.get("status");
  const trackingNumber = form.get("trackingNumber");
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId) || typeof status !== "string" || !ORDER_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.redirect(new URL("/admin?update=invalid", request.url), 303);
  }

  try {
    await advanceOrderStatus(orderId, status as OrderStatus, typeof trackingNumber === "string" ? trackingNumber : undefined);
    return NextResponse.redirect(new URL(`/admin?update=${encodeURIComponent(orderId)}`, request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin?update=error", request.url), 303);
  }
}
