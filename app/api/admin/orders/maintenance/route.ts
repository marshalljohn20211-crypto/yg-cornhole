import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { runOrderMaintenance } from "../../../../lib/order-maintenance";

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new NextResponse("Invalid request origin.", { status: 403 });

  try {
    const result = await runOrderMaintenance();
    const summary = `${result.recovered}-${result.expired}-${result.deleted}-${result.errors}`;
    return NextResponse.redirect(new URL(`/admin?maintenance=${summary}`, request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/admin?maintenance=error", request.url), 303);
  }
}
