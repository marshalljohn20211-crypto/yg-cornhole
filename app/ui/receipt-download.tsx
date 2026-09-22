"use client";

import { Download, Printer } from "lucide-react";
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
  const [downloading, setDownloading] = useState(false);

  async function downloadReceipt() {
    if (!receiptToken || downloading) return;
    try {
      setDownloading(true);
      setMessage("");
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptToken }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "The receipt could not be downloaded.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `YG-Cornhole-receipt-${orderId}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Receipt downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The receipt could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="order-confirmation__actions">
      {receiptToken ? (
        <button type="button" onClick={downloadReceipt} disabled={downloading}>
          <Download size={17} />{downloading ? "Preparing receipt…" : "Download receipt"}
        </button>
      ) : (
        <p>This browser no longer has the private receipt link. Contact YG Cornhole with the order reference if you need another copy.</p>
      )}
      <button type="button" className="is-secondary" onClick={() => window.print()}><Printer size={17} />Print confirmation</button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
