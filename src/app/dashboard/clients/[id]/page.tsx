import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { 
  ExternalLink, 
  Shield, 
  ShieldOff, 
  Clock, 
  Globe, 
  ArrowLeft, 
  Key, 
  RefreshCw, 
  History,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateApiKey, toggleClientStatus } from "@/lib/actions";
import { CopyButton } from "@/components/copy-button";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      payments: {
        orderBy: { paidAt: "desc" },
      },
      admins: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage client settings and security access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Status & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Overview Card */}
          <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${
                  client.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {client.status === 'active' ? <Shield size={40} /> : <ShieldOff size={40} />}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Current Status</div>
                  <div className={`text-2xl font-bold ${
                    client.status === 'active' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {client.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1">
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Next Renewal Date</div>
                <div className="text-xl font-bold flex items-center gap-2">
                  <Clock size={18} className="text-indigo-500" />
                  {format(client.nextPaymentDate, "MMMM d, yyyy")}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Website URL</div>
                <a href={client.websiteUrl} target="_blank" className="flex items-center gap-2 text-indigo-500 hover:underline">
                  <Globe size={14} />
                  {client.websiteUrl}
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400 uppercase">Database Instance</div>
                <div className="flex items-center gap-2 font-mono text-sm text-slate-600 dark:text-slate-300">
                  <AlertCircle size={14} />
                  {client.dbUrl}
                </div>
              </div>
            </div>

            {/* Background Accent */}
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${
              client.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
          </div>

          {/* API Security Hub */}
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="text-indigo-500" />
                <h2 className="text-xl font-bold">API Security</h2>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-slate-500 leading-relaxed text-pretty">
                Use this API Key on the client website to authenticate status requests. 
                Keep this key secret. If compromised, regenerate it immediately.
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 group relative transition-all">
                  <div className="font-mono text-sm text-slate-400 blur-sm group-hover:blur-none transition-all duration-300 select-all">
                    {client.apiKey || "No API Key Generated"}
                  </div>
                  {client.apiKey && <CopyButton text={client.apiKey} />}
                </div>
                
                <form action={regenerateApiKey.bind(null, client.id)}>
                  <button className="h-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2">
                    <RefreshCw size={18} />
                    {client.apiKey ? "Regenerate" : "Generate Key"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <History className="text-indigo-500" />
              <h2 className="text-xl font-bold">Billing History</h2>
            </div>
            <div className="overflow-x-auto">
              {client.payments.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 text-xs uppercase">
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {client.payments.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-8 py-4">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full uppercase">
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-bold text-slate-900 dark:text-white">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-8 py-4 text-sm text-slate-500">
                          {format(payment.paidAt, "MMM d, yyyy HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  No payment history found for this client.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Management */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4">Authorized Admins</h2>
            <div className="space-y-4">
              {client.admins.map((admin: any) => (
                <div key={admin.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{admin.email}</div>
                  <div className="text-[10px] text-slate-500 uppercase mt-1">Client Admin</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-red-500/5 border-red-500/20">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-slate-500 mb-4">
              Suspension will immediately trigger the remote "Kill Switch" on the client website.
            </p>
            <form action={toggleClientStatus.bind(null, client.id, client.status)}>
              <button 
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  client.status === 'active' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {client.status === 'active' ? <ShieldOff size={20} /> : <Shield size={20} />}
                {client.status === 'active' ? 'Suspend Client Access' : 'Restore Client Access'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
