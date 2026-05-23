"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CheckCircle2 } from "lucide-react";
import { CashfreePayButton } from "@/components/cashfree-pay-button";
import { formatBillingCycle } from "@/lib/billing";
import { formatINR } from "@/lib/currency";

export function AdminPaymentOptions({
  clientId,
  amount,
  billingCycle,
  canPay,
}: {
  clientId: string;
  amount: number;
  billingCycle: string;
  canPay: boolean;
}) {
  const router = useRouter();
  const [showCashForm, setShowCashForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCashPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/clients/${clientId}/payments/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: formData.get("amount"),
        paidAt: formData.get("paidAt"),
        reference: formData.get("reference"),
      }),
    });
    const data = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data?.error || "Unable to record cash payment.");
      return;
    }

    setMessage("Cash payment recorded. Client access is active.");
    setShowCashForm(false);
    router.refresh();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-locked-border bg-locked-panel-solid/70 p-5">
        <div className="text-xs font-bold text-locked-muted uppercase tracking-wider mb-2">
          Payable Amount
        </div>
        <div className="text-4xl font-black text-locked-text">{formatINR(amount)}</div>
        <div className="mt-2 text-sm text-locked-muted">
          Billing cycle: {formatBillingCycle(billingCycle)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => setShowCashForm((open) => !open)}
          disabled={!canPay}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-5 py-4 font-bold text-brand-gradient-end transition-all hover:bg-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Banknote size={18} />
          Record Cash Payment
        </button>
        <CashfreePayButton
          endpoint={`/api/admin/clients/${clientId}/payments/create-order`}
          disabled={!canPay}
          label="Online Checkout"
        />
      </div>

      {showCashForm && (
        <form onSubmit={handleCashPayment} className="space-y-4 rounded-2xl border border-locked-border bg-locked-panel-solid/70 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-locked-muted">Amount Paid</span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-locked-muted">₹</span>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={amount}
                  required
                  className="w-full rounded-xl border border-locked-border bg-locked-bg px-4 py-3 pl-9 text-locked-text outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-locked-muted">Payment Date</span>
              <input
                name="paidAt"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-xl border border-locked-border bg-locked-bg px-4 py-3 text-locked-text outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-xs font-bold uppercase text-locked-muted">Note / Reference</span>
            <input
              name="reference"
              type="text"
              placeholder="Optional receipt note or internal reference"
              className="w-full rounded-xl border border-locked-border bg-locked-bg px-4 py-3 text-locked-text outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-3 font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue disabled:opacity-60"
          >
            <CheckCircle2 size={18} />
            {isSaving ? "Recording..." : "Confirm Cash Payment"}
          </button>
        </form>
      )}

      {message && (
        <p className={`text-sm ${message.includes("Unable") ? "text-red-400" : "text-brand-gradient-end"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
