import { auth } from "@/auth";
import { formatINR } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const session = await auth();
  if (!session?.user?.clientId) {
    redirect("/login");
  }

  const payments = await prisma.payment.findMany({
    where: { 
      clientId: session.user.clientId,
      provider: { in: ["CASHFREE", "MANUAL_CASH"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
          <p className="text-locked-muted mt-1">View your billing history and past transactions.</p>
        </div>
        <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
          <Receipt size={24} />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-locked-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-locked-panel-solid/70 text-locked-muted text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold">Reference</th>
                <th className="px-6 py-4 font-bold text-right">Status</th>
                <th className="px-6 py-4 font-bold text-right">Receipt / Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-locked-border bg-locked-bg/30">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-locked-panel-solid/70 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4 font-bold text-locked-text">
                    {formatINR(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-locked-muted">
                    {payment.provider === "MANUAL_CASH" ? "Cash" : "Cashfree"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-locked-muted">
                    {payment.provider === "MANUAL_CASH"
                      ? payment.transactionId || "—"
                      : payment.cashfreePaymentId || payment.cashfreeOrderId || "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-gradient-end font-bold rounded-full text-xs">
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.status === "PAID" ? (
                      <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                        <Link
                          href={`/portal/receipts/${payment.id}/invoice`}
                          className="inline-flex items-center justify-center rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-gradient-end transition-all hover:bg-brand-blue/20"
                        >
                          View Receipt
                        </Link>
                        <Link
                          href={`/portal/receipts/${payment.id}/invoice?print=1`}
                          className="inline-flex items-center justify-center rounded-full border border-locked-border bg-locked-panel-solid px-3 py-1 text-xs font-bold text-locked-muted transition-all hover:text-locked-text"
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
                  <td colSpan={6} className="px-6 py-24 text-center">
                     <div className="flex flex-col items-center justify-center space-y-3 text-locked-muted/80">
                       <Receipt size={32} className="opacity-20" />
                       <p>No past payment receipts found.</p>
                     </div>
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
