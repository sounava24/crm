"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { BILLING_CYCLES, BILLING_STATUSES, formatBillingCycle } from "@/lib/billing";

type BillingSettingsFormProps = {
  clientId: string;
  billingAmount: number;
  billingCycle: string;
  nextRenewalDate: string;
  billingStatus: string;
  billingNote?: string | null;
};

export function BillingSettingsForm({
  clientId,
  billingAmount,
  billingCycle,
  nextRenewalDate,
  billingStatus,
  billingNote,
}: BillingSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/clients/${clientId}/billing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingAmount: formData.get("billingAmount"),
        billingCycle: formData.get("billingCycle"),
        nextRenewalDate: formData.get("nextRenewalDate"),
        billingStatus: formData.get("billingStatus"),
        billingNote: formData.get("billingNote"),
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error || "Unable to save billing settings.");
      return;
    }

    setMessage("Billing settings saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-xs font-bold text-locked-muted uppercase">Amount</span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-locked-muted">₹</span>
            <input
              name="billingAmount"
              type="number"
              min="0"
              step="1"
              defaultValue={billingAmount}
              className="w-full rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 pl-9 text-locked-text outline-none transition-all focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold text-locked-muted uppercase">Billing Cycle</span>
          <select
            name="billingCycle"
            defaultValue={billingCycle}
            className="w-full rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 text-locked-text outline-none transition-all focus:ring-2 focus:ring-brand-blue"
          >
            {BILLING_CYCLES.map((cycle) => (
              <option key={cycle} value={cycle}>
                {formatBillingCycle(cycle)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold text-locked-muted uppercase">Next Renewal Date</span>
          <input
            name="nextRenewalDate"
            type="date"
            defaultValue={nextRenewalDate}
            className="w-full rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 text-locked-text outline-none transition-all focus:ring-2 focus:ring-brand-blue"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold text-locked-muted uppercase">Payment Status</span>
          <select
            name="billingStatus"
            defaultValue={billingStatus}
            className="w-full rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 text-locked-text outline-none transition-all focus:ring-2 focus:ring-brand-blue"
          >
            {BILLING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status[0] + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-xs font-bold text-locked-muted uppercase">Internal Note</span>
        <textarea
          name="billingNote"
          rows={3}
          defaultValue={billingNote || ""}
          placeholder="Optional note for internal billing context"
          className="w-full resize-none rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 text-locked-text outline-none transition-all focus:ring-2 focus:ring-brand-blue"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${message?.includes("Unable") ? "text-red-400" : "text-locked-muted"}`}>
          {message}
        </p>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-gradient-end px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition-all hover:from-brand-gradient-end hover:to-brand-blue disabled:opacity-60"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Billing Settings"}
        </button>
      </div>
    </form>
  );
}
