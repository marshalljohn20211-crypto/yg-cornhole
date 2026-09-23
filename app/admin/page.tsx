import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { demoOrders } from "./demo-orders";
import { isAdminAuthenticated } from "../lib/admin-auth";
import { adminStatusChanges, listOrders, ORDER_STATUSES, type OrderStatus } from "../lib/orders";

export const metadata: Metadata = { title: "Orders | YG Cornhole Admin", robots: { index: false, follow: false } };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function label(status: OrderStatus) {
  return status === "pending" ? "Pending payment" : status.replaceAll("_", " ");
}

function statusHelp(status: OrderStatus) {
  if (status === "pending") return "PayPal has not confirmed payment. Fulfillment choices unlock after a successful capture; this order can only be cancelled now.";
  if (status === "paid") return "Payment is confirmed. Start processing or mark shipped with a tracking number.";
  if (status === "processing") return "The order is being prepared. Mark it shipped when it leaves, or return it to paid if preparation has not started.";
  if (status === "shipped") return "Tracking is recorded. Mark completed when fulfillment is finished.";
  if (status === "completed") return "Fulfillment is complete. This is a final shop-managed state.";
  if (status === "cancelled") return "The unpaid order was cancelled. No payment was refunded.";
  if (status === "refunded") return "PayPal reported a refund. Refunds cannot be created by changing this label.";
  if (status === "expired") return "The unpaid order expired during reconciliation.";
  return "PayPal reported a payment failure. The unpaid order can be cancelled.";
}

function pageHref(page: number, query: string, status: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "active") params.set("status", status);
  params.set("page", String(page));
  return `/admin?${params}`;
}

export default async function AdminOrders({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const params = await searchParams;
  const demo = first(params.demo) === "1";
  const query = first(params.q)?.trim().slice(0, 120) ?? "";
  const rawStatus = first(params.status) ?? "active";
  const status = rawStatus === "all" || rawStatus === "active" || ORDER_STATUSES.includes(rawStatus as OrderStatus)
    ? rawStatus as OrderStatus | "all" | "active"
    : "active";
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);
  const samples = demo ? demoOrders() : [];
  const result = demo
    ? { orders: samples, total: samples.length, page: 1, pages: 1 }
    : await listOrders({ page, query, status });
  const maintenance = first(params.maintenance);
  const update = first(params.update);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><div className="admin-mark" aria-hidden="true">YG</div><div><span>Private order desk</span><h1>Orders</h1></div></div>
        <div className="admin-header__actions">
          {!demo ? <form action="/api/admin/orders/maintenance" method="post"><button type="submit">Reconcile PayPal</button></form> : null}
          <form action="/api/admin/logout" method="post"><button type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="admin-orders" aria-labelledby="orders-heading">
        <nav className="admin-view-switch" aria-label="Order view"><Link href="/admin" aria-current={!demo ? "page" : undefined}>Live orders</Link><Link href="/admin?demo=1" aria-current={demo ? "page" : undefined}>Demo orders</Link></nav>
        {demo ? <p role="status" className="admin-demo-banner"><strong>Demo preview — no real orders or payments.</strong> These nine sample records show every order state. Changes are disabled here; return to Live orders to manage actual purchases.</p> : null}
        {!demo && maintenance ? <p className={`admin-notice${maintenance === "error" ? " is-error" : ""}`}>{maintenance === "error" ? "PayPal reconciliation failed. Check the server logs and configuration." : `Reconciliation finished: ${maintenance.split("-")[0]} recovered, ${maintenance.split("-")[1]} expired, ${maintenance.split("-")[2]} removed, ${maintenance.split("-")[3]} errors.`}</p> : null}
        {!demo && update ? <p role={update === "error" || update === "invalid" || update === "conflict" ? "alert" : "status"} className={`admin-notice${update === "error" || update === "invalid" || update === "conflict" ? " is-error" : ""}`}>{update === "error" ? "The database rejected this status change. Check the application logs or database update permissions, then try again." : update === "invalid" ? "Choose a valid order status and try again." : update === "conflict" ? "This order changed since the page loaded. Refresh the page and check its current status." : `Order ${update} was updated.`}</p> : null}
        <div className="admin-summary"><div><span>{demo ? "Sample orders" : "Matching orders"}</span><strong>{result.total}</strong></div><p id="orders-heading">{demo ? "Preview how each status appears before a real customer completes checkout." : "PayPal confirms payment first. Then update paid orders as they are processed, shipped, and completed."}</p></div>

        {!demo ? <form className="admin-filters" action="/admin" method="get">
          <label>Search<input name="q" defaultValue={query} placeholder="Order, capture, customer or email" /></label>
          <label>Status<select name="status" defaultValue={status}><option value="active">Active orders</option><option value="all">All statuses</option>{ORDER_STATUSES.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>
          <button type="submit">Apply filters</button>
          <Link href="/admin">Clear</Link>
        </form> : null}

        <div className="admin-workflow"><strong>Order flow</strong><p>Pending payment → Paid by PayPal → Processing → Shipped with tracking → Completed. Cancel is for unpaid orders only; refunds and payment failures come from PayPal.</p></div>

        {result.orders.length === 0 ? (
          <div className="admin-empty"><strong>No matching orders</strong><p>Try clearing the search or choosing another status.</p></div>
        ) : (
          <div className="admin-order-list">
            {result.orders.map((order, index) => {
              const statusChanges = adminStatusChanges(order);
              return (
                <details className="admin-order" key={order.id} open={demo && index === 1 ? true : undefined}>
                  <summary>
                    <div><span className={`admin-status admin-status--${order.status}`}>{label(order.status)}</span><strong>{order.customer.fullName}</strong><small>{order.id}</small>{demo ? <span className="admin-demo-tag">Demo</span> : null}</div>
                    <div><strong>{money(order.total)}</strong><small>{date(order.paidAt ?? order.createdAt)}</small></div>
                  </summary>
                  <div className="admin-order-body">
                    <section><h2>Customer</h2><dl><div><dt>Name</dt><dd>{order.customer.fullName}</dd></div><div><dt>Email</dt><dd>{demo ? order.customer.email : <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>}</dd></div><div><dt>Contact</dt><dd>{demo ? order.customer.phone : <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>}</dd></div></dl></section>
                    <section><h2>Delivery</h2><address>{order.customer.addressLine1}<br />{order.customer.addressLine2 ? <>{order.customer.addressLine2}<br /></> : null}{order.customer.city}, {order.customer.state} {order.customer.postalCode}<br />{order.customer.countryCode === "US" ? "United States" : "Canada"}</address>{order.customer.deliveryNotes ? <p><b>Notes:</b> {order.customer.deliveryNotes}</p> : null}{order.trackingNumber ? <p><b>Tracking:</b> {order.trackingNumber}</p> : null}</section>
                    <section><h2>Payment</h2><dl><div><dt>Status</dt><dd>{order.paymentStatus}</dd></div><div><dt>PayPal order</dt><dd>{demo ? "Sample only" : order.id}</dd></div>{order.captureId && !demo ? <div><dt>Capture</dt><dd>{order.captureId}</dd></div> : null}<div><dt>Created</dt><dd>{date(order.createdAt)}</dd></div>{order.paidAt ? <div><dt>Paid</dt><dd>{date(order.paidAt)}</dd></div> : null}{order.fulfilledAt ? <div><dt>Completed</dt><dd>{date(order.fulfilledAt)}</dd></div> : null}</dl></section>
                    <section className="admin-items"><h2>Items</h2>{order.items.map((item, index) => <div key={`${item.slug}-${index}`}><div><strong>{item.name}</strong><small>{item.size} · {item.color} · Qty {item.quantity}</small></div><span>{money(item.unitAmount * item.quantity)}</span></div>)}<dl><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{money(order.shipping)}</dd></div><div><dt>Total</dt><dd>{money(order.total)}</dd></div></dl></section>
                    <section className="admin-fulfillment"><h2>{demo ? "What happens next" : "Update order status"}</h2><p>{statusHelp(order.status)}</p>{demo ? <p className="admin-demo-options">{statusChanges.length ? `Available actions: ${statusChanges.map(label).join(" or ")}.` : "No manual update is available in this state."} This example is read-only.</p> : statusChanges.length ? <form action={`/api/admin/orders/${encodeURIComponent(order.id)}/status`} method="post"><label>New status<select name="status" defaultValue="" required><option value="" disabled>Choose a status</option>{statusChanges.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>{statusChanges.includes("shipped") ? <label>Tracking number <span>Required when marking shipped</span><input name="trackingNumber" maxLength={120} /></label> : null}<button className={statusChanges[0] === "cancelled" ? "is-destructive" : undefined} type="submit">{statusChanges[0] === "cancelled" ? "Cancel unpaid order" : "Save status"}</button></form> : null}</section>
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {!demo && result.pages > 1 ? <nav className="admin-pagination" aria-label="Order pages"><Link aria-disabled={result.page === 1} href={pageHref(Math.max(1, result.page - 1), query, status)}>Previous</Link><span>Page {result.page} of {result.pages}</span><Link aria-disabled={result.page === result.pages} href={pageHref(Math.min(result.pages, result.page + 1), query, status)}>Next</Link></nav> : null}
      </section>
    </main>
  );
}
