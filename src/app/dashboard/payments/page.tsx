import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CreditCard, ArrowUpRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { client: true },
    orderBy: { paidAt: "desc" },
  });

  const totalRevenue = payments.reduce((acc: number, curr: any) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track subscription renewals and total revenue collection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={<CreditCard className="text-indigo-500" />} 
          subtitle="Lifetime earnings"
        />
        <StatsCard 
          title="Active Subs" 
          value={Array.from(new Set(payments.map((p: any) => p.clientId))).length.toString()} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          subtitle="Paying customers"
        />
        <StatsCard 
          title="Avg. Ticket" 
          value={`$${(payments.length > 0 ? totalRevenue / payments.length : 0).toFixed(2)}`} 
          icon={<ArrowUpRight className="text-purple-500" />} 
          subtitle="Per payment"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <h2 className="font-bold text-lg">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {payments.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{payment.client.name}</div>
                    <div className="text-xs text-slate-500">{payment.client.websiteUrl}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {payment.paidAt ? format(payment.paidAt, "MMM d, yyyy HH:mm") : "Pending"}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
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
        <span className="text-slate-500 font-medium">{title}</span>
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}
