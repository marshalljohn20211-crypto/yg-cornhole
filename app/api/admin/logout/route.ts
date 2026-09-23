import { NextResponse, type NextRequest } from "next/server";
import { adminCookie } from "../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../lib/admin-origin";

export async function POST(request: NextRequest) {
  if (!adminRequestOrigin(request)) {
    return new NextResponse("Invalid request origin.", { status: 403 });
  }
  const response = adminRedirect(request, "/admin/login");
  response.cookies.set(adminCookie.name, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "strict" });
  return response;
}
