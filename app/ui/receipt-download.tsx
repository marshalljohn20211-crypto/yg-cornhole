"use client";

import { Download, Eye, Printer, ReceiptText } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function receiptTokenFromHash() {
  return new URLSearchParams(window.location.hash.slice(1)).get("receipt") ?? "";
}

export default function ReceiptDownload({ orderId }: { orderId: string }) {
  const receiptToken = useSyncExternalStore(subscribeToHash, receiptTokenFromHash, () => "");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"view" | "download" | "">("");

  async function getReceipt(download: boolean) {
    if (!receiptToken || action) return;
    const previewWindow = download ? null : window.open("about:blank", "_blank");
    if (!download && !previewWindow) {
      setMessage("Allow pop-ups to open the receipt, or use Download receipt instead.");
      return;
    }
    try {
      setAction(download ? "download" : "view");
      setMessage("");
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptToken, download }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "The receipt could not be downloaded.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `YG-Cornhole-receipt-${orderId}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setMessage("Branded receipt downloaded.");
      } else {
        previewWindow!.opener = null;
        previewWindow!.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      previewWindow?.close();
      setMessage(error instanceof Error ? error.message : "The receipt could not be downloaded.");
    } finally {
      setAction("");
    }
  }

  return (
    <div className="order-confirmation__receipt">
      <div className="order-confirmation__receipt-heading"><ReceiptText size={24} /><div><strong>Your YG receipt is ready</strong><span>View it now, save a branded copy, or print this confirmation.</span></div></div>
      <div className="order-confirmation__actions">
        {receiptToken ? <>
          <button type="button" onClick={() => getReceipt(false)} disabled={Boolean(action)}><Eye size={17} />{action === "view" ? "Opening receipt…" : "View receipt"}</button>
          <button type="button" className="is-secondary" onClick={() => getReceipt(true)} disabled={Boolean(action)}><Download size={17} />{action === "download" ? "Preparing receipt…" : "Download receipt"}</button>
        </> : <p>This browser no longer has the private receipt link. Contact YG Cornhole with the order reference if you need another copy.</p>}
        <button type="button" className="is-secondary" onClick={() => window.print()}><Printer size={17} />Print confirmation</button>
        {message ? <p role="status">{message}</p> : null}
      </div>
    </div>
  );
}
