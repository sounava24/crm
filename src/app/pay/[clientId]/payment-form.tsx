import { CashfreePayButton } from "@/components/cashfree-pay-button";
import { formatBillingCycle } from "@/lib/billing";
import { formatINR } from "@/lib/currency";

export function PaymentForm({
  amount,
  billingCycle,
  canPay,
}: {
  amount: number;
  billingCycle: string;
  canPay: boolean;
}) {
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
      <CashfreePayButton disabled={!canPay} />
      {!canPay && (
        <p className="text-center text-sm text-locked-muted">
          There is no pending Cashfree payment for this account.
        </p>
      )}
    </div>
  );
}
