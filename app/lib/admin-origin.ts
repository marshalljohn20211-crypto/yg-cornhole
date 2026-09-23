import { NextResponse, type NextRequest } from "next/server";

const productionOrigins = new Set([
  "https://ygcornhole.com",
  "https://www.ygcornhole.com",
  "https://49j0il7qb2.c39.airoapp.ai",
  "https://49j0il7qb2.preview.c39.airoapp.ai",
]);

export function adminRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  if (productionOrigins.has(origin)) return origin;
  if (process.env.NODE_ENV !== "production" && origin === new URL(request.url).origin) return origin;
  return null;
}

export function adminRedirect(request: NextRequest, path: string) {
  const origin = adminRequestOrigin(request)
    ?? (process.env.NODE_ENV === "production" ? "https://ygcornhole.com" : new URL(request.url).origin);
  return NextResponse.redirect(new URL(path, origin), 303);
}
