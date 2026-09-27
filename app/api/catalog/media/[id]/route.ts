import type { RowDataPacket } from "mysql2";
import { getDatabase } from "../../../../lib/database";

type MediaRow = RowDataPacket & { mime: string; content: Buffer };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const [rows] = await getDatabase().execute<MediaRow[]>("SELECT mime, content FROM catalog_media WHERE id = ? LIMIT 1", [id]);
  const media = rows[0];
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.content), {
    headers: {
      "Content-Type": media.mime,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
