import { NextResponse, type NextRequest } from "next/server";
import { adminCookie, createAdminSession, isAdminConfigured, verifyAdminCredentials } from "../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../lib/admin-origin";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) return adminRedirect(request, "/admin/login?error=config");

  if (!adminRequestOrigin(request)) {
    return new NextResponse("Invalid request origin.", { status: 403 });
  }

  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const current = attempts.get(key);
  const attempt = !current || current.resetAt <= now ? { count: 0, resetAt: now + 15 * 60_000 } : current;
  if (attempt.count >= 8) return adminRedirect(request, "/admin/login?error=locked");

  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !await verifyAdminCredentials(username, password)) {
    attempts.set(key, { ...attempt, count: attempt.count + 1 });
    return adminRedirect(request, "/admin/login?error=invalid");
  }

  attempts.delete(key);
  const response = adminRedirect(request, "/admin");
  response.cookies.set(adminCookie.name, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminCookie.maxAge,
  });
  return response;
}
