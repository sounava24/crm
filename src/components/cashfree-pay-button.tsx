"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard } from "lucide-react";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_modal";
      }) => Promise<unknown>;
    };
  }
}

type CashfreeOrderResponse = {
  orderId: string;
  paymentSessionId: string;
  mode: "sandbox" | "production";
  error?: string;
};

export function CashfreePayButton({
  disabled,
  label = "Pay Now",
  endpoint = "/api/client/payments/create-order",
}: {
  disabled?: boolean;
  label?: string;
  endpoint?: string;
}) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (disabled || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as CashfreeOrderResponse;

      if (!response.ok || !data.paymentSessionId) {
        throw new Error(data.error || "Unable to create Cashfree order.");
      }

      if (!window.Cashfree || !scriptReady) {
        window.location.href = `/payment-success?order_id=${encodeURIComponent(data.orderId)}`;
        return;
      }

      const cashfree = window.Cashfree({ mode: data.mode || "sandbox" });
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setIsLoading(false);
      router.refresh();
    }
  }

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="space-y-2">
        <button
          type="button"
          onClick={handlePay}
          disabled={disabled || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-4 font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard size={18} />
          {isLoading ? "Opening Cashfree..." : label}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </>
  );
}
