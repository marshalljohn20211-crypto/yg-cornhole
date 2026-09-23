import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../../../lib/admin-origin";
import { advanceOrderStatus, ORDER_STATUSES, type OrderStatus } from "../../../../../lib/orders";

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!adminRequestOrigin(request)) return new NextResponse("Invalid request origin.", { status: 403 });
  if (!await isAdminAuthenticated()) return adminRedirect(request, "/admin/login");

  const { orderId } = await params;
  const form = await request.formData();
  const status = form.get("status");
  const trackingNumber = form.get("trackingNumber");
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId) || typeof status !== "string" || !ORDER_STATUSES.includes(status as OrderStatus)) {
    return adminRedirect(request, "/admin?update=invalid");
  }

  try {
    await advanceOrderStatus(orderId, status as OrderStatus, typeof trackingNumber === "string" ? trackingNumber : undefined);
    return adminRedirect(request, `/admin?update=${encodeURIComponent(orderId)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Order not found." || message.startsWith("Order cannot move") || message.startsWith("Order changed while")) {
      return adminRedirect(request, "/admin?update=conflict");
    }
    if (message.startsWith("Enter a tracking number")) {
      return adminRedirect(request, "/admin?update=invalid");
    }
    console.error("Admin order status update failed", {
      orderId,
      status,
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
      message,
    });
    return adminRedirect(request, "/admin?update=error");
  }
}
