"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type VerifyState = {
  status: "verifying" | "success" | "failed";
  message: string;
};

export function VerifyPaymentClient({ orderId }: { orderId?: string }) {
  const [state, setState] = useState<VerifyState>({
    status: "verifying",
    message: "Verifying your Cashfree payment...",
  });

  useEffect(() => {
    if (!orderId) {
      setState({ status: "failed", message: "Missing Cashfree order ID." });
      return;
    }

    const verifiedOrderId = orderId;
    let active = true;

    async function verify() {
      try {
        const response = await fetch(
          `/api/client/payments/verify?orderId=${encodeURIComponent(verifiedOrderId)}`
        );
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          throw new Error(data?.error || "Payment verification failed.");
        }

        if (data.status === "PAID") {
          setState({
            status: "success",
            message: "Payment confirmed. Your billing status has been updated.",
          });
        } else {
          setState({
            status: "failed",
            message: `Payment status is ${data.status || "pending"}. Please check again later.`,
          });
        }
      } catch (err) {
        if (!active) return;
        setState({
          status: "failed",
          message: err instanceof Error ? err.message : "Payment verification failed.",
        });
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [orderId]);

  const isSuccess = state.status === "success";
  const isVerifying = state.status === "verifying";

  return (
    <div className="min-h-screen bg-locked-bg flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl border border-locked-border p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-blue/20 bg-brand-blue/10 text-brand-blue">
          {isVerifying ? (
            <Loader2 size={32} className="animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 size={32} />
          ) : (
            <XCircle size={32} className="text-red-400" />
          )}
        </div>
        <h1 className="text-2xl font-black text-locked-text">
          {isVerifying ? "Verifying Payment" : isSuccess ? "Payment Successful" : "Payment Not Confirmed"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-locked-muted">{state.message}</p>
        <Link
          href="/portal"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-3 font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
