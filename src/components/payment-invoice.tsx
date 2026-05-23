import { formatBillingCycle } from "@/lib/billing";
import { formatINR } from "@/lib/currency";
import { format } from "date-fns";
import Image from "next/image";

type InvoicePayment = {
  id: string;
  amount: number;
  status: string;
  provider: string;
  transactionId: string | null;
  cashfreeOrderId: string | null;
  cashfreePaymentId: string | null;
  cashfreeReferenceId: string | null;
  billingCycle: string | null;
  paidAt: Date | null;
  createdAt: Date;
  client: {
    name: string;
    websiteUrl: string;
    nextRenewalDate: Date | null;
    billingCycle: string;
    admins?: { email: string }[];
  };
};

export function getPaymentMethod(provider: string) {
  return provider === "MANUAL_CASH" ? "Cash" : "Cashfree";
}

export function getPaymentReference(payment: Pick<
  InvoicePayment,
  | "provider"
  | "transactionId"
  | "cashfreeOrderId"
  | "cashfreePaymentId"
  | "cashfreeReferenceId"
  | "id"
>) {
  if (payment.provider === "MANUAL_CASH") {
    return payment.transactionId || payment.id;
  }

  return (
    payment.cashfreePaymentId ||
    payment.cashfreeReferenceId ||
    payment.cashfreeOrderId ||
    payment.id
  );
}

export function PaymentInvoice({ payment }: { payment: InvoicePayment }) {
  const receiptNumber = `INV-${payment.id.slice(-8).toUpperCase()}`;
  const paymentDate = payment.paidAt || payment.createdAt;
  const reference = getPaymentReference(payment);
  const clientEmail = payment.client.admins?.[0]?.email || "—";

  return (
    <main className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-slate-950 shadow-2xl print:shadow-none print:rounded-none">
      <header className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Image
                src="/main.png"
                alt="DM Stack Labs Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-wider text-[#1E90FF]">
                DM Stack Labs
              </div>
              <h1 className="text-3xl font-black tracking-tight">Payment Receipt</h1>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Receipt Number
            </div>
            <div className="mt-1 font-mono text-sm font-bold">{receiptNumber}</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Client</div>
          <div className="mt-1 text-lg font-bold">{payment.client.name}</div>
          <div className="mt-1 text-sm text-slate-600">{clientEmail}</div>
          <div className="mt-1 text-sm text-slate-600">{payment.client.websiteUrl}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Payment Date
          </div>
          <div className="mt-1 font-bold">{format(paymentDate, "MMMM d, yyyy")}</div>
        </div>
      </section>

      <section className="py-6">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <InvoiceRow
            label="Billing Cycle"
            value={formatBillingCycle(payment.billingCycle || payment.client.billingCycle)}
          />
          <InvoiceRow label="Payment Method" value={getPaymentMethod(payment.provider)} />
          <InvoiceRow label="Payment Status" value={payment.status.toUpperCase()} strong />
          <InvoiceRow label="Reference ID" value={reference} mono />
          <InvoiceRow
            label="Next Renewal Date"
            value={
              payment.client.nextRenewalDate
                ? format(payment.client.nextRenewalDate, "MMMM d, yyyy")
                : "—"
            }
          />
          <InvoiceRow label="Amount Paid" value={formatINR(payment.amount)} strong last />
        </div>
      </section>

      {payment.status !== "PAID" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Final receipt download is available only after payment status is PAID.
        </div>
      )}

      <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
        <p>This is a system-generated payment receipt from DM Stack Labs.</p>
        <p className="mt-1">For any billing queries, contact DM Stack Labs support.</p>
      </footer>
    </main>
  );
}

function InvoiceRow({
  label,
  value,
  strong,
  mono,
  last,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 ${last ? "" : "border-b border-slate-200"}`}>
      <div className="bg-slate-50 p-4 text-sm font-bold text-slate-600">{label}</div>
      <div
        className={`break-all p-4 text-sm ${strong ? "font-black" : ""} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
