import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../../lib/admin-origin";
import { runOrderMaintenance } from "../../../../lib/order-maintenance";

export async function POST(request: NextRequest) {
  if (!adminRequestOrigin(request)) return new NextResponse("Invalid request origin.", { status: 403 });
  if (!await isAdminAuthenticated()) return adminRedirect(request, "/admin/login");

  try {
    const result = await runOrderMaintenance();
    const summary = `${result.recovered}-${result.expired}-${result.deleted}-${result.errors}`;
    return adminRedirect(request, `/admin?maintenance=${summary}`);
  } catch {
    return adminRedirect(request, "/admin?maintenance=error");
  }
}
