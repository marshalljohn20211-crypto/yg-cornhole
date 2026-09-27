import { redirect } from "next/navigation";
import AdminHeader from "../admin-header";
import { isAdminAuthenticated } from "../../lib/admin-auth";

export default async function CatalogMigrationPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");

  return (
    <main className="admin-shell">
      <AdminHeader active="products" />
      <section className="admin-orders admin-catalog">
        <div className="admin-catalog-heading">
          <h2>Install catalog tables</h2>
          <p>This additive migration creates the category, product, and media tables. Existing orders and administrator accounts are unchanged.</p>
        </div>
        <form className="admin-editor" action="/api/admin/catalog-migration" method="post">
          <div className="admin-editor-actions">
            <button type="submit">Install catalog tables</button>
          </div>
        </form>
      </section>
    </main>
  );
}
