import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { paypalRequest } from "../lib/paypal";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";

export const metadata: Metadata = { title: "Order Confirmed | YG Cornhole" };

export default async function OrderConfirmation({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id: orderId } = await searchParams;
  let isCompleted = false;
  if (orderId && /^[A-Z0-9]{8,32}$/i.test(orderId)) {
    try {
      const order = await paypalRequest<{ status?: string }>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      isCompleted = order.status === "COMPLETED";
    } catch {
      isCompleted = false;
    }
  }

  return (
    <main className="store-page" id="main-content">
      <SiteHeader />
      <section className="order-confirmation">
        {isCompleted ? <CheckCircle2 size={48} /> : <CircleAlert size={48} />}
        <span>{isCompleted ? "Payment complete" : "Payment status"}</span>
        <h1>{isCompleted ? "Your order is on the board." : "We could not verify this order."}</h1>
        <p>{isCompleted ? "PayPal confirmed the payment. YG Cornhole will use the shipping details attached to the transaction to prepare your order." : "Open your PayPal activity to confirm the transaction, or contact YG Cornhole with the order reference below."}</p>
        {orderId ? <div><small>PayPal order</small><strong>{orderId}</strong></div> : null}
        <Link href="/shop">Keep shopping <ArrowRight size={17} /></Link>
      </section>
      <StoreFooter />
    </main>
  );
}
