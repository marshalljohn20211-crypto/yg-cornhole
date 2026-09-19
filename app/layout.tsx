import type { Metadata } from "next";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import "./store.css";
import { CartProvider } from "./ui/cart-provider";
import ToastProvider from "./ui/toast-provider";

export const metadata: Metadata = {
  title: "YG Cornhole | Competition Bags, Boards & Apparel",
  description: "ACL-approved cornhole bags, custom boards, and apparel built for players who take every throw seriously.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><CartProvider>{children}<ToastProvider /></CartProvider></body>
    </html>
  );
}
