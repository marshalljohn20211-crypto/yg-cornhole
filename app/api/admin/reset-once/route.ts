import { createHash, timingSafeEqual } from "node:crypto";
import type { ResultSetHeader } from "mysql2";
import { getDatabase } from "../../../lib/database";

// One-time recovery route. Remove this file after the live reset is verified.
const RESET_TOKEN_HASH = "ddc1e1a6d7fa6d13a397918819ff3222d96dd760682486b0141953381974e5c8";
const PREVIOUS_PASSWORD_HASH = "bbfbbacc4edb0a8309d76c49972643119629de1bafab57793025a25308e755bc3375eff4e5840de1bf3aee94be52ff2d2b086e7f94a5263433a4ea5d1d665f3a";
const NEW_PASSWORD_HASH = "fa0599da170c1f36f10c5b1dd611b64ab50de9e8a8e55abc35be2367a2c5fef216f6f915d66e0011b251fac3404f2d4760495e4cc35de4bee78e50315fb56b25";
const NEW_PASSWORD_SALT = "247ce4f1bd4ae632a0f29e0fc0c689c2da3606abd6a6d2e12b06ba9cca924d59";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const actual = Buffer.from(createHash("sha256").update(token).digest("hex"), "hex");
  const expected = Buffer.from(RESET_TOKEN_HASH, "hex");
  if (!token || !timingSafeEqual(actual, expected)) {
    return Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const [result] = await getDatabase().execute<ResultSetHeader>(
      "UPDATE admin_users SET password_hash = ?, password_salt = ? WHERE username = ? AND password_hash = ? AND is_active = 1",
      [NEW_PASSWORD_HASH, NEW_PASSWORD_SALT, "admin", PREVIOUS_PASSWORD_HASH],
    );
    return Response.json(
      { ok: result.affectedRows === 1 },
      { status: result.affectedRows === 1 ? 200 : 409, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
