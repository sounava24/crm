import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Receipt, Download } from "lucide-react";
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
      status: "paid"
    },
    orderBy: { paidAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
          <p className="text-slate-500 mt-1">View your billing history and past transactions.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
          <Receipt size={24} />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold">Transaction ID</th>
                <th className="px-6 py-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white/30 dark:bg-slate-950/30">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 capitalize">
                    {payment.method || "System"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {payment.transactionId || payment.id}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold rounded-full text-xs">
                      PAID
                    </span>
                  </td>
                </tr>
              ))}
              
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                     <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
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
