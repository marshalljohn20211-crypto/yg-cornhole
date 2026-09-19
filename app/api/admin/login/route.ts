import { NextResponse, type NextRequest } from "next/server";
import { adminCookie, createAdminSession, isAdminConfigured, verifyAdminPassword } from "../../../lib/admin-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) return redirectTo(request, "/admin/login?error=config");

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return new NextResponse("Invalid request origin.", { status: 403 });
  }

  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = attempts.get(key);
  const attempt = !current || current.resetAt <= now ? { count: 0, resetAt: now + 15 * 60_000 } : current;
  if (attempt.count >= 8) return redirectTo(request, "/admin/login?error=locked");

  const formData = await request.formData();
  const password = formData.get("password");
  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    attempts.set(key, { ...attempt, count: attempt.count + 1 });
    return redirectTo(request, "/admin/login?error=invalid");
  }

  attempts.delete(key);
  const response = redirectTo(request, "/admin");
  response.cookies.set(adminCookie.name, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminCookie.maxAge,
  });
  return response;
}
