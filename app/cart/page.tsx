import type { Metadata } from "next";
import { connection } from "next/server";
import CartPage from "../ui/cart-page";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";
import { getCatalog } from "../lib/catalog";

export const metadata: Metadata = { title: "Your Cart | YG Cornhole" };

export default async function Cart() {
  await connection();

  const paypalEnvironment = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  const paypalClientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const catalog = await getCatalog();
  return <main className="store-page" id="main-content"><SiteHeader /><CartPage paypalEnvironment={paypalEnvironment} paypalClientId={paypalClientId} products={catalog.products} /><StoreFooter /></main>;
}
