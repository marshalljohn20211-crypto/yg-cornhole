import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import { adminRedirect, adminRequestOrigin } from "../../../lib/admin-origin";
import { archiveCatalogEntry, getCatalog, parseCategoryForm, parseProductForm, saveCategory, saveProduct } from "../../../lib/catalog";
import { getDatabase } from "../../../lib/database";

function imageMime(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((part, index) => bytes[index] === part)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))) return "image/avif";
  return null;
}

export async function POST(request: NextRequest) {
  if (!adminRequestOrigin(request)) return new NextResponse("Invalid request origin.", { status: 403 });
  if (!await isAdminAuthenticated()) return adminRedirect(request, "/admin/login");

  const form = await request.formData();
  const type = form.get("type");
  const operation = form.get("operation");
  const target = type === "category" ? "categories" : "products";

  try {
    if (type !== "category" && type !== "product") throw new Error("Unknown catalog type.");
    if (operation === "archive") {
      const slug = String(form.get("slug") ?? "");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid slug.");
      await archiveCatalogEntry(target, slug);
      return adminRedirect(request, `/admin/${target}?saved=deleted`);
    }
    if (operation !== "create" && operation !== "edit") throw new Error("Unknown catalog action.");
    if (type === "category") {
      const category = parseCategoryForm(form);
      await saveCategory(category, operation);
      return adminRedirect(request, `/admin/categories?edited=${encodeURIComponent(category.slug)}`);
    }

    const catalog = await getCatalog();
    if (!catalog.ready) throw new Error("Catalog tables are not installed. Run the catalog migration first.");
    const upload = form.get("upload");
    let imageId: string | undefined;
    let mime: string | null = null;
    let bytes: Uint8Array | undefined;
    if (upload instanceof File && upload.size > 0) {
      if (upload.size > 2_000_000) throw new Error("Image must be under 2 MB.");
      bytes = new Uint8Array(await upload.arrayBuffer());
      mime = imageMime(bytes);
      if (!mime) throw new Error("Upload a JPG, PNG, WebP, or AVIF image.");
      imageId = randomUUID();
    }
    const product = parseProductForm(form, catalog, imageId ? `/api/catalog/media/${imageId}` : undefined);
    if (imageId && mime && bytes) {
      await getDatabase().execute("INSERT INTO catalog_media (id, mime, content) VALUES (?, ?, ?)", [imageId, mime, Buffer.from(bytes)]);
    }
    await saveProduct(product, operation);
    return adminRedirect(request, `/admin/products?edited=${encodeURIComponent(product.slug)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 220) : "Could not save the catalog entry.";
    const destination = (operation === "edit" || operation === "archive") && typeof form.get("slug") === "string"
      ? `/admin/${target}/${encodeURIComponent(String(form.get("slug")))}`
      : `/admin/${target}/new`;
    return adminRedirect(request, `${destination}?error=${encodeURIComponent(message)}`);
  }
}
