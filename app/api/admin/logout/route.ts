import { NextResponse, type NextRequest } from "next/server";
import { adminCookie } from "../../../lib/admin-auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return new NextResponse("Invalid request origin.", { status: 403 });
  }
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(adminCookie.name, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "strict" });
  return response;
}
