"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CreditCard, LockKeyhole, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { toast } from "react-toastify";
import type { CartLine } from "./cart-provider";
import { useCart } from "./cart-provider";

type PayPalEnvironment = "sandbox" | "live";
type PayPalOrderData = { orderId: string };
type CheckoutIssue = { code: string; title: string; detail: string; action: string };
type PaymentMethod = "paypal" | "card";
type CardSubmitResult = {
  state: "succeeded" | "canceled" | "failed" | string;
  data?: { orderId?: string; message?: string };
};
type CardFieldsSession = {
  createCardFieldsComponent: (options: {
    type: "number" | "expiry" | "cvv";
    placeholder: string;
    style?: { input: Record<string, string> };
  }) => Node;
  submit: (
    orderId: string,
    options?: { billingAddress?: { postalCode: string } },
  ) => Promise<CardSubmitResult>;
};
type PayPalInstance = {
  findEligibleMethods: (options?: { currencyCode: "USD" }) => Promise<{ isEligible: (method: string) => boolean }>;
  createPayPalOneTimePaymentSession: (callbacks: {
    onApprove: (data: PayPalOrderData) => Promise<unknown>;
    onCancel: () => void;
    onError: () => void;
  }) => {
    start: (options: { presentationMode: "auto" }, order: Promise<{ orderId: string }>) => Promise<void>;
  };
  createCardFieldsOneTimePaymentSession: () => CardFieldsSession;
};
type PayPalSDK = {
  createInstance: (config: {
    clientId?: string;
    clientToken?: string;
    components: string[];
    pageType: "checkout";
  }) => Promise<PayPalInstance>;
};

declare global {
  interface Window { paypal?: PayPalSDK }
}

type CheckoutResponse = {
  error?: string;
  code?: string;
  id?: string;
  status?: string;
  clientToken?: string;
};

async function readJson(response: Response) {
  const data = await response.json() as CheckoutResponse;
  if (!response.ok) {
    const error = new Error(data.error ?? "PayPal could not process the payment.") as Error & { code?: string };
    error.code = data.code;
    throw error;
  }
  return data;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      const error = new Error(message) as Error & { code?: string };
      error.code = "PAYPAL_SDK_LOAD_FAILED";
      reject(error);
    }, milliseconds);

    promise.then((value) => {
      window.clearTimeout(timeoutId);
      resolve(value);
    }, (error) => {
      window.clearTimeout(timeoutId);
      reject(error);
    });
  });
}

function describeIssue(code: string, detail: string): CheckoutIssue {
  if (code === "PAYPAL_CONFIG_MISSING") {
    return {
      code,
      title: "PayPal is not configured",
      detail,
      action: "Add all three PayPal variables to this deployment, then redeploy the site.",
    };
  }
  if (code === "PAYPAL_INVALID_CREDENTIALS") {
    return {
      code,
      title: "PayPal credentials were rejected",
      detail,
      action: "Replace them with a matching active Client ID and Secret from the same PayPal REST app.",
    };
  }
  if (code === "PAYPAL_NOT_ELIGIBLE") {
    return {
      code,
      title: "PayPal is unavailable here",
      detail,
      action: "Try another browser or location, or contact the shop for another way to pay.",
    };
  }
  if (code === "CARD_NOT_ELIGIBLE") {
    return {
      code,
      title: "Card payment is unavailable",
      detail,
      action: "Choose PayPal above, or retry from another browser or location.",
    };
  }
  if (code === "PAYPAL_SDK_LOAD_FAILED") {
    return {
      code,
      title: "PayPal could not load",
      detail,
      action: "Check the connection or content blocker, then refresh this page.",
    };
  }
  return {
    code,
    title: "PayPal connection failed",
    detail,
    action: "No payment was attempted. Retry the connection or contact the shop.",
  };
}

function describeCardFailure(error: unknown, environment: PayPalEnvironment) {
  const fallback = "The card payment could not be completed. Check the card and address details, then try again.";
  const rawMessage = typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : "";
  let parsed: unknown;

  try {
    parsed = rawMessage.trim().startsWith("{") ? JSON.parse(rawMessage) : undefined;
  } catch {
    parsed = undefined;
  }

  const serialized = parsed ? JSON.stringify(parsed) : rawMessage;
  if (/UNPROCESSABLE_ENTITY|ERR_DEV_RECEIVED_CLIENT_ERROR_RESPONSE/i.test(serialized)) {
    return environment === "sandbox"
      ? "PayPal Sandbox rejected these test details. Use a PayPal Sandbox test card (not 4242), a future expiry, and a valid state/province and postal code."
      : "PayPal could not process these card or billing details. Check the card number, expiry, security code, and address, then try again.";
  }

  if (/INSTRUMENT_DECLINED|CARD_DECLINED|DECLINED/i.test(serialized)) {
    return "The card was declined. Try another card or choose PayPal.";
  }

  if (rawMessage && !rawMessage.trim().startsWith("{") && rawMessage.length <= 180) {
    return rawMessage;
  }

  return fallback;
}

export default function PayPalCheckout({
  environment,
  clientId,
  items,
}: {
  environment: PayPalEnvironment;
  clientId: string;
  items: CartLine[];
}) {
  const router = useRouter();
  const { clearCart } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const deliveryFormRef = useRef<HTMLFormElement>(null);
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardExpiryRef = useRef<HTMLDivElement>(null);
  const cardCvvRef = useRef<HTMLDivElement>(null);
  const cardSessionRef = useRef<CardFieldsSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [issue, setIssue] = useState<CheckoutIssue | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const cartKey = useMemo(() => JSON.stringify(items), [items]);
  const sdkSource = environment === "live"
    ? "https://www.paypal.com/web-sdk/v6/core"
    : "https://www.sandbox.paypal.com/web-sdk/v6/core";

  const getShippingDetails = useCallback(() => {
    const form = deliveryFormRef.current;
    if (!form || !form.reportValidity()) {
      throw new Error("Complete your delivery details before paying.");
    }
    const data = new FormData(form);
    return {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      addressLine1: String(data.get("addressLine1") ?? ""),
      addressLine2: String(data.get("addressLine2") ?? ""),
      city: String(data.get("city") ?? ""),
      state: String(data.get("state") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      countryCode: String(data.get("countryCode") ?? "US"),
      deliveryNotes: String(data.get("deliveryNotes") ?? ""),
    };
  }, []);

  useEffect(() => {
    if (paymentMethod !== "paypal") return;
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let button: HTMLElement | null = null;
    let clickHandler: (() => Promise<void>) | null = null;

    async function mountButton() {
      try {
        setStatus("loading");
        setIssue(null);
        for (let attempt = 0; attempt < 120 && !window.paypal; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 125));
        }
        if (!window.paypal) {
          const error = new Error("The PayPal checkout script loaded but did not finish initializing.") as Error & { code?: string };
          error.code = "PAYPAL_SDK_LOAD_FAILED";
          throw error;
        }
        if (!clientId) {
          const error = new Error("The PayPal Client ID is missing from this deployment.") as Error & { code?: string };
          error.code = "PAYPAL_CONFIG_MISSING";
          throw error;
        }
        const sdk = await withTimeout(
          window.paypal.createInstance({
            clientId,
            components: ["paypal-payments"],
            pageType: "checkout",
          }),
          12_000,
          "PayPal loaded but did not finish initializing the checkout.",
        );
        const eligibility = await withTimeout(
          sdk.findEligibleMethods({ currencyCode: "USD" }),
          8_000,
          "PayPal could not confirm checkout availability.",
        );
        if (!eligibility.isEligible("paypal")) {
          const error = new Error("PayPal did not mark this checkout as eligible for the current browser and location.") as Error & { code?: string };
          error.code = "PAYPAL_NOT_ELIGIBLE";
          throw error;
        }
        const session = sdk.createPayPalOneTimePaymentSession({
          onApprove: async ({ orderId }) => {
            const response = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });
            const order = await readJson(response);
            if (order.status !== "COMPLETED" || !order.id) throw new Error("PayPal has not completed this payment.");
            toast.success("Payment completed. Your order is confirmed.");
            router.push(`/order-confirmation?order_id=${encodeURIComponent(order.id)}`);
            clearCart();
            return order;
          },
          onCancel: () => toast.info("PayPal checkout was cancelled. Your cart is unchanged."),
          onError: () => toast.error("PayPal could not complete the payment. Please try again."),
        });

        if (disposed || !containerRef.current) return;
        containerRef.current.replaceChildren();
        button = document.createElement("paypal-button");
        button.setAttribute("type", "pay");
        button.setAttribute("aria-label", "Pay securely with PayPal");
        clickHandler = async () => {
          try {
            const shipping = getShippingDetails();
            const orderPromise = fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items, shipping }),
            }).then(readJson).then((order) => {
              if (!order.id) throw new Error("PayPal did not return an order ID.");
              return { orderId: order.id };
            });
            await session.start({ presentationMode: "auto" }, orderPromise);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "PayPal could not start checkout.");
          }
        };
        button.addEventListener("click", clickHandler);
        containerRef.current.append(button);
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        const message = error instanceof Error ? error.message : "PayPal could not load.";
        const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
          ? error.code
          : "PAYPAL_CONNECTION_FAILED";
        setIssue(describeIssue(code, message));
        toast.error(message);
      }
    }

    mountButton();
    return () => {
      disposed = true;
      if (button && clickHandler) button.removeEventListener("click", clickHandler);
    };
  }, [cartKey, clearCart, clientId, getShippingDetails, items, paymentMethod, retryKey, router]);

  useEffect(() => {
    if (paymentMethod !== "card") return;
    let disposed = false;

    async function mountCardFields() {
      try {
        setStatus("loading");
        setIssue(null);
        setCardMessage(null);
        cardSessionRef.current = null;

        for (let attempt = 0; attempt < 120 && !window.paypal; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 125));
        }
        if (!window.paypal) {
          const error = new Error("The PayPal checkout script loaded but did not finish initializing.") as Error & { code?: string };
          error.code = "PAYPAL_SDK_LOAD_FAILED";
          throw error;
        }

        const tokenResponse = await fetch("/api/paypal/client-token", { cache: "no-store" });
        const tokenData = await readJson(tokenResponse);
        if (!tokenData.clientToken) {
          throw new Error("PayPal did not return the secure token needed for card payments.");
        }

        const sdk = await withTimeout(
          window.paypal.createInstance({
            clientToken: tokenData.clientToken,
            components: ["card-fields"],
            pageType: "checkout",
          }),
          12_000,
          "PayPal loaded but did not finish initializing card payments.",
        );
        const eligibility = await withTimeout(
          sdk.findEligibleMethods({ currencyCode: "USD" }),
          8_000,
          "PayPal could not confirm card-payment availability.",
        );
        if (!eligibility.isEligible("advanced_cards")) {
          const error = new Error("PayPal did not mark Advanced Card Payments as eligible for this checkout.") as Error & { code?: string };
          error.code = "CARD_NOT_ELIGIBLE";
          throw error;
        }

        const session = sdk.createCardFieldsOneTimePaymentSession();
        const fieldStyle = {
          input: {
            color: "#0d151e",
            fontSize: "16px",
            fontFamily: "Arial, sans-serif",
            fontWeight: "500",
            padding: "13px 14px",
          },
        };
        const fields = [
          [cardNumberRef.current, "number", "Card number"],
          [cardExpiryRef.current, "expiry", "MM/YY"],
          [cardCvvRef.current, "cvv", "Security code"],
        ] as const;

        if (fields.some(([fieldContainer]) => !fieldContainer)) return;
        fields.forEach(([fieldContainer, type, placeholder]) => {
          fieldContainer?.replaceChildren();
          fieldContainer?.appendChild(
            session.createCardFieldsComponent({ type, placeholder, style: fieldStyle }),
          );
        });

        if (disposed) return;
        cardSessionRef.current = session;
        setStatus("ready");
      } catch (error) {
        if (disposed) return;
        setStatus("error");
        const message = error instanceof Error ? error.message : "Card payments could not load.";
        const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
          ? error.code
          : "PAYPAL_CARD_CONNECTION_FAILED";
        setIssue(describeIssue(code, message));
        toast.error(message);
      }
    }

    mountCardFields();
    return () => {
      disposed = true;
      cardSessionRef.current = null;
    };
  }, [cartKey, paymentMethod, retryKey]);

  async function handleCardPayment() {
    const session = cardSessionRef.current;
    if (!session || status !== "ready" || cardSubmitting) return;

    try {
      setCardSubmitting(true);
      setCardMessage(null);
      const shipping = getShippingDetails();
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shipping }),
      });
      const order = await readJson(response);
      if (!order.id) throw new Error("PayPal did not return an order ID.");

      const trimmedPostalCode = shipping.postalCode.trim();
      const result = await session.submit(
        order.id,
        trimmedPostalCode ? { billingAddress: { postalCode: trimmedPostalCode } } : undefined,
      );
      if (result.state === "canceled") {
        const message = "Card verification was cancelled. Your cart is unchanged.";
        setCardMessage(message);
        toast.info(message);
        return;
      }
      if (result.state !== "succeeded") {
        const message = describeCardFailure(result.data?.message, environment);
        setCardMessage(message);
        toast.error(message);
        return;
      }

      const captureResponse = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: result.data?.orderId ?? order.id }),
      });
      const completedOrder = await readJson(captureResponse);
      if (completedOrder.status !== "COMPLETED" || !completedOrder.id) {
        throw new Error("PayPal has not completed this card payment.");
      }
      toast.success("Card payment completed. Your order is confirmed.");
      router.push("/order-confirmation?order_id=" + encodeURIComponent(completedOrder.id));
      clearCart();
    } catch (error) {
      const message = describeCardFailure(error, environment);
      setCardMessage(message);
      toast.error(message);
    } finally {
      setCardSubmitting(false);
    }
  }

  function retryCheckout() {
    setStatus("loading");
    setIssue(null);
    setRetryKey((value) => value + 1);
  }

  function handleSdkError() {
    const nextIssue = describeIssue(
      "PAYPAL_SDK_LOAD_FAILED",
      "The PayPal checkout script did not load from PayPal.",
    );
    setStatus("error");
    setIssue(nextIssue);
    toast.error(nextIssue.title);
  }

  return (
    <form className="paypal-checkout" ref={deliveryFormRef} onSubmit={(event) => event.preventDefault()}>
      <Script src={sdkSource} strategy="afterInteractive" onError={handleSdkError} />
      <fieldset className="delivery-details">
        <legend>Delivery details</legend>
        <p>We’ll use these details to prepare and deliver your order.</p>
        <label className="card-field-label" htmlFor="checkout-full-name">Full name<input id="checkout-full-name" name="fullName" autoComplete="name" maxLength={300} required /></label>
        <div className="card-field-row">
          <label className="card-field-label" htmlFor="checkout-email">Email<input id="checkout-email" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label className="card-field-label" htmlFor="checkout-phone">Contact number<input id="checkout-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} required /></label>
        </div>
        <label className="card-field-label" htmlFor="checkout-address">Street address<input id="checkout-address" name="addressLine1" autoComplete="shipping address-line1" maxLength={300} required /></label>
        <label className="card-field-label" htmlFor="checkout-address-two">Apartment, suite, etc. <small>Optional</small><input id="checkout-address-two" name="addressLine2" autoComplete="shipping address-line2" maxLength={300} /></label>
        <div className="card-field-row">
          <label className="card-field-label" htmlFor="checkout-city">City<input id="checkout-city" name="city" autoComplete="shipping address-level2" maxLength={120} required /></label>
          <label className="card-field-label" htmlFor="checkout-state">State / province<input id="checkout-state" name="state" autoComplete="shipping address-level1" maxLength={2} placeholder="TX" required /></label>
        </div>
        <div className="card-field-row">
          <label className="card-field-label" htmlFor="checkout-postal-code">Postal code<input id="checkout-postal-code" name="postalCode" autoComplete="shipping postal-code" maxLength={10} required /></label>
          <label className="card-field-label" htmlFor="checkout-country">Country<select id="checkout-country" name="countryCode" autoComplete="shipping country" defaultValue="US"><option value="US">United States</option><option value="CA">Canada</option></select></label>
        </div>
        <label className="card-field-label" htmlFor="checkout-notes">Delivery notes <small>Optional</small><textarea id="checkout-notes" name="deliveryNotes" maxLength={500} rows={3} placeholder="Gate code, safe place, or delivery instructions" /></label>
      </fieldset>
      <div className="paypal-checkout__heading"><span>Choose how to pay</span><ShieldCheck size={19} /></div>
      <div className="payment-method-tabs" role="group" aria-label="Payment method">
        <button type="button" aria-pressed={paymentMethod === "paypal"} onClick={() => setPaymentMethod("paypal")}>
          <WalletCards size={17} /> PayPal
        </button>
        <button type="button" aria-pressed={paymentMethod === "card"} onClick={() => setPaymentMethod("card")}>
          <CreditCard size={17} /> Card
        </button>
      </div>
      {paymentMethod === "paypal" ? (
      <div
        className={`paypal-button-shell${status === "error" ? " is-hidden" : ""}${status !== "ready" && status !== "error" ? " is-loading" : ""}`}
        ref={containerRef}
        role="status"
        aria-live="polite"
        aria-label={status !== "ready" && status !== "error" ? "Connecting securely to PayPal" : "PayPal checkout ready"}
        aria-busy={status === "loading"}
      />
      ) : (
        <div className="card-payment-form" role="tabpanel">
          <div className="card-field-label">Card number<div ref={cardNumberRef} className="card-field-host" aria-label="Card number" /></div>
          <div className="card-field-row">
            <div className="card-field-label">Expiry<div ref={cardExpiryRef} className="card-field-host" aria-label="Card expiry" /></div>
            <div className="card-field-label">Security code<div ref={cardCvvRef} className="card-field-host" aria-label="Card security code" /></div>
          </div>
          {environment === "sandbox" ? <p className="sandbox-card-hint">Sandbox test: use a PayPal test card such as Visa 4005 5192 0000 0004, a future expiry, and any 3-digit security code.</p> : null}
          {status !== "error" ? <button className="card-pay-button" type="button" onClick={handleCardPayment} disabled={status !== "ready" || cardSubmitting}><CreditCard size={17} />{cardSubmitting ? "Processing payment…" : "Pay securely by card"}</button> : null}
          {cardMessage ? <p className="card-payment-message" role="alert">{cardMessage}</p> : null}
        </div>
      )}
      {status === "error" && issue ? (
        <div className="paypal-diagnostic" role="alert" aria-live="assertive">
          <AlertTriangle size={24} />
          <div>
            <small>Checkout blocked</small>
            <strong>{issue.title}</strong>
            <p>{issue.detail}</p>
            <p>{issue.action}</p>
          </div>
          <code>{issue.code}</code>
          <button type="button" onClick={retryCheckout}><RefreshCw size={14} /> Retry {paymentMethod === "card" ? "card payment" : "PayPal"}</button>
        </div>
      ) : null}
      <p><LockKeyhole size={13} /> Payment is approved in PayPal and verified by the YG Cornhole server.</p>
    </form>
  );
}
