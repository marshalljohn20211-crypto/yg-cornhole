"use client";

export default function CatalogDeleteButton({ type, slug, name, disabled = false, reason }: { type: "product" | "category"; slug: string; name: string; disabled?: boolean; reason?: string }) {
  return (
    <form className="admin-delete-inline" action="/api/admin/catalog" method="post" onSubmit={(event) => {
      if (!window.confirm(`Delete ${name} from the shop? Past order records will remain available.`)) event.preventDefault();
    }}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="operation" value="archive" />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" disabled={disabled} title={reason}>{disabled ? reason ?? "Cannot delete" : "Delete"}</button>
    </form>
  );
}
