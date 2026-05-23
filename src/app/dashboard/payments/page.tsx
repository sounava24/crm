import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CreditCard, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { formatBillingCycle } from "@/lib/billing";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { provider: { in: ["CASHFREE", "MANUAL_CASH"] } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
  const paidPayments = payments.filter((payment) => payment.status === "PAID" || payment.status === "paid");
  const totalRevenue = paidPayments.reduce((acc: number, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-locked-muted mt-1">
            Track subscription renewals and total revenue collection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={formatINR(totalRevenue)} 
          icon={<CreditCard className="text-brand-blue" />} 
          subtitle="Lifetime earnings"
        />
        <StatsCard 
          title="Active Subs" 
          value={Array.from(new Set(paidPayments.map((payment) => payment.clientId))).length.toString()} 
          icon={<CheckCircle2 className="text-brand-accent" />} 
          subtitle="Paying customers"
        />
        <StatsCard 
          title="Avg. Ticket" 
          value={formatINR(paidPayments.length > 0 ? totalRevenue / paidPayments.length : 0)} 
          icon={<ArrowUpRight className="text-brand-accent" />} 
          subtitle="Per payment"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-locked-border bg-locked-panel-solid/70">
          <h2 className="font-bold text-lg">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-locked-bg text-locked-muted text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Method & Reference</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Cycle</th>
                <th className="px-6 py-4 font-semibold">Next Renewal</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-locked-border">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-locked-panel-solid/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.client.name}</div>
                    <div className="text-xs text-locked-muted">{payment.client.websiteUrl}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-locked-text">
                    {formatINR(payment.amount)}
                  </td>
                  <td className="px-6 py-4">
                    {payment.provider === "MANUAL_CASH" ? (
                      <>
                        <div className="text-sm font-medium">Cash</div>
                        <div className="text-xs text-locked-muted font-mono">
                          Reference: {payment.transactionId || "—"}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium">Cashfree</div>
                        <div className="text-xs text-locked-muted font-mono">Order: {payment.cashfreeOrderId || "—"}</div>
                        <div className="text-xs text-locked-muted font-mono">Payment: {payment.cashfreePaymentId || "—"}</div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-brand-blue/10 text-brand-gradient-end text-xs font-bold rounded-full">
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-locked-muted">
                    {formatBillingCycle(payment.billingCycle || payment.client.billingCycle)}
                  </td>
                  <td className="px-6 py-4 text-sm text-locked-muted">
                    {payment.client.nextRenewalDate
                      ? format(payment.client.nextRenewalDate, "MMM d, yyyy")
                      : format(payment.client.nextPaymentDate, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-locked-muted">
                    {payment.paidAt ? format(payment.paidAt, "MMM d, yyyy HH:mm") : "Pending"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.status === "PAID" ? (
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/dashboard/payments/${payment.id}/invoice`}
                          className="inline-flex rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-gradient-end transition-all hover:bg-brand-blue/20"
                        >
                          View Receipt
                        </Link>
                        <Link
                          href={`/dashboard/payments/${payment.id}/invoice?print=1`}
                          className="inline-flex rounded-full border border-locked-border bg-locked-panel-solid px-3 py-1 text-xs font-bold text-locked-muted transition-all hover:text-locked-text"
                        >
                          Download Invoice
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-locked-muted/70">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-locked-muted/80">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle }: { title: string; value: string; icon: React.ReactNode; subtitle: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-locked-muted font-medium">{title}</span>
        <div className="p-2 bg-locked-panel-solid rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-locked-muted/80">{subtitle}</div>
    </div>
  );
}
