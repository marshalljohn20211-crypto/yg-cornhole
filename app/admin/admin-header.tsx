import Link from "next/link";

export default function AdminHeader({ active, reconcile = false }: { active: "orders" | "products" | "categories"; reconcile?: boolean }) {
  return (
    <header className="admin-header admin-header--desk">
      <div><div className="admin-mark" aria-hidden="true">YG</div><div><span>Private store desk</span><h1>{active}</h1></div></div>
      <nav className="admin-main-nav" aria-label="Admin navigation">
        <Link href="/admin" aria-current={active === "orders" ? "page" : undefined}>Orders</Link>
        <Link href="/admin/products" aria-current={active === "products" ? "page" : undefined}>Products</Link>
        <Link href="/admin/categories" aria-current={active === "categories" ? "page" : undefined}>Categories</Link>
        <Link href="/shop">View shop</Link>
      </nav>
      <div className="admin-header__actions">
        {reconcile ? <form action="/api/admin/orders/maintenance" method="post"><button type="submit">Reconcile PayPal</button></form> : null}
        <form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form>
      </div>
    </header>
  );
}
