import Link from "next/link";
import AdminHeader from "./admin-header";

export default function CatalogShell({
  section, title, intro, ready, error, saved, children,
}: {
  section: "products" | "categories";
  title: string;
  intro: string;
  ready: boolean;
  error?: string;
  saved?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell">
      <AdminHeader active={section} />
      <section className="admin-orders admin-catalog">
        <div className="admin-catalog-heading"><div><Link href={`/admin/${section}`}>← {section}</Link><h2>{title}</h2><p>{intro}</p></div></div>
        {!ready ? <p role="alert" className="admin-notice is-error">Catalog editing is unavailable until the additive SQL migration <code>db/migrations/2026-09-26-catalog-cms.sql</code> is applied. The existing storefront remains visible.</p> : null}
        {error ? <p role="alert" className="admin-notice is-error">{error}</p> : null}
        {saved ? <p role="status" className="admin-notice">{saved === "deleted" || saved === "archived" ? "Deleted from the shop. Past orders are unchanged." : "Saved successfully. The storefront now uses this change."}</p> : null}
        {children}
      </section>
    </main>
  );
}
