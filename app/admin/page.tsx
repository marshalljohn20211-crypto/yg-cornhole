import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../lib/admin-auth";
import { listOrders } from "../lib/orders";

export const metadata: Metadata = { title: "Orders | YG Cornhole Admin", robots: { index: false, follow: false } };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminOrders() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const orders = await listOrders();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><div className="admin-mark" aria-hidden="true">YG</div><div><span>Private order desk</span><h1>Orders</h1></div></div>
        <form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form>
      </header>

      <section className="admin-orders" aria-labelledby="orders-heading">
        <div className="admin-summary"><div><span>Recorded orders</span><strong>{orders.length}</strong></div><p id="orders-heading">Newest orders appear first. Open an order to see its customer, delivery, payment, and item details.</p></div>
        {orders.length === 0 ? (
          <div className="admin-empty"><strong>No orders yet</strong><p>Completed and in-progress checkouts will appear here.</p></div>
        ) : (
          <div className="admin-order-list">
            {orders.map((order) => (
              <details className="admin-order" key={order.id}>
                <summary>
                  <div><span className={`admin-status admin-status--${order.status}`}>{order.status}</span><strong>{order.customer.fullName}</strong><small>{order.id}</small></div>
                  <div><strong>{money(order.total)}</strong><small>{date(order.paidAt ?? order.createdAt)}</small></div>
                </summary>
                <div className="admin-order-body">
                  <section><h2>Customer</h2><dl><div><dt>Name</dt><dd>{order.customer.fullName}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a></dd></div><div><dt>Contact</dt><dd><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></dd></div></dl></section>
                  <section><h2>Delivery</h2><address>{order.customer.addressLine1}<br />{order.customer.addressLine2 ? <>{order.customer.addressLine2}<br /></> : null}{order.customer.city}, {order.customer.state} {order.customer.postalCode}<br />{order.customer.countryCode === "US" ? "United States" : "Canada"}</address>{order.customer.deliveryNotes ? <p><b>Notes:</b> {order.customer.deliveryNotes}</p> : null}</section>
                  <section><h2>Payment</h2><dl><div><dt>Status</dt><dd>{order.paymentStatus}</dd></div><div><dt>PayPal order</dt><dd>{order.id}</dd></div>{order.captureId ? <div><dt>Capture</dt><dd>{order.captureId}</dd></div> : null}<div><dt>Created</dt><dd>{date(order.createdAt)}</dd></div>{order.paidAt ? <div><dt>Paid</dt><dd>{date(order.paidAt)}</dd></div> : null}</dl></section>
                  <section className="admin-items"><h2>Items</h2>{order.items.map((item, index) => <div key={`${item.slug}-${index}`}><div><strong>{item.name}</strong><small>{item.size} · {item.color} · Qty {item.quantity}</small></div><span>{money(item.unitAmount * item.quantity)}</span></div>)}<dl><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{money(order.shipping)}</dd></div><div><dt>Total</dt><dd>{money(order.total)}</dd></div></dl></section>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
