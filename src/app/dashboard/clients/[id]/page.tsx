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
  Phone,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateApiKey, toggleClientStatus, updateClientPhone } from "@/lib/actions";
import { CopyButton } from "@/components/copy-button";
import { formatINR } from "@/lib/currency";
import { BillingSettingsForm } from "@/components/billing-settings-form";
import { formatBillingCycle } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      payments: {
        orderBy: [{ paidAt: "desc" }, { id: "desc" }],
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
          className="p-2 rounded-xl bg-locked-panel-solid/70 hover:bg-locked-card transition-all border border-locked-border"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-locked-muted">Manage client settings and security access.</p>
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
                  <div className="text-sm font-medium text-locked-muted uppercase tracking-wider mb-1">Current Status</div>
                  <div className={`text-2xl font-bold ${
                    client.status === 'active' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {client.status.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1">
                <div className="text-sm font-medium text-locked-muted uppercase tracking-wider">Next Renewal Date</div>
                <div className="text-xl font-bold flex items-center gap-2">
                  <Clock size={18} className="text-brand-blue" />
                  {format(client.nextPaymentDate, "MMMM d, yyyy")}
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-locked-border grid grid-cols-1 gap-6 relative z-10">
              <div className="space-y-1">
                <div className="text-xs font-bold text-locked-muted/80 uppercase">Website URL</div>
                <a href={client.websiteUrl} target="_blank" className="flex items-center gap-2 text-brand-blue hover:underline">
                  <Globe size={14} />
                  {client.websiteUrl}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Background Accent */}
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${
              client.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
          </div>

          {/* Billing & Subscription */}
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="text-brand-blue" />
                <div>
                  <h2 className="text-xl font-bold">Billing & Subscription</h2>
                  <p className="text-sm text-locked-muted">
                    Set the client&apos;s INR billing amount and renewal schedule.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3 text-right">
                <div className="text-xs font-bold uppercase text-locked-muted">Current Amount</div>
                <div className="text-lg font-black text-brand-gradient-end">
                  {formatINR(client.billingAmount)}
                </div>
              </div>
            </div>

            <BillingSettingsForm
              clientId={client.id}
              billingAmount={client.billingAmount}
              billingCycle={client.billingCycle}
              nextRenewalDate={format(client.nextRenewalDate || client.nextPaymentDate, "yyyy-MM-dd")}
              billingStatus={client.billingStatus}
              billingNote={client.billingNote}
            />
          </div>

          {/* Website Preview */}
          <div className="glass-card p-4 rounded-3xl overflow-hidden relative">
             <div className="flex items-center gap-2 text-sm font-bold text-locked-muted mb-4 px-4">
               <Globe size={16} /> Live Website Preview
             </div>
             <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-locked-border bg-slate-900/5 relative">
               <div className="absolute inset-x-0 top-0 h-10 bg-locked-card flex items-center px-4 gap-2 border-b border-locked-border">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                 <div className="ml-4 flex-1 bg-locked-panel-solid rounded-md py-1 px-3 text-xs text-locked-muted truncate text-center">
                   {client.websiteUrl}
                 </div>
               </div>
               <iframe 
                 src={client.websiteUrl} 
                 className="w-full h-full pt-10 border-0"
                 title={`${client.name} Website`}
                 sandbox="allow-same-origin allow-scripts"
               />
             </div>
          </div>

          {/* API Security Hub */}
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Key className="text-brand-blue" />
                <h2 className="text-xl font-bold">API Security</h2>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-locked-muted leading-relaxed text-pretty">
                Use this API Key on the client website to authenticate status requests. 
                Keep this key secret. If compromised, regenerate it immediately.
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-locked-border group relative transition-all">
                  <div className="font-mono text-sm text-locked-muted/80 blur-sm group-hover:blur-none transition-all duration-300 select-all">
                    {client.apiKey || "No API Key Generated"}
                  </div>
                  {client.apiKey && <CopyButton text={client.apiKey} />}
                </div>
                
                <form action={regenerateApiKey.bind(null, client.id)}>
                  <button className="h-full px-6 py-4 bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue text-white rounded-xl font-bold transition-all flex items-center gap-2">
                    <RefreshCw size={18} />
                    {client.apiKey ? "Regenerate" : "Generate Key"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-locked-border flex items-center gap-3">
              <History className="text-brand-blue" />
              <h2 className="text-xl font-bold">Billing History</h2>
            </div>
            <div className="overflow-x-auto">
              {client.payments.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-locked-bg text-locked-muted text-xs uppercase">
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Cycle</th>
                      <th className="px-8 py-4">Method & Reference</th>
                      <th className="px-8 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-locked-border">
                    {client.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-8 py-4">
                          <span className="px-2 py-1 bg-brand-blue/10 text-brand-gradient-end text-[10px] font-bold rounded-full uppercase">
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-bold text-locked-text">
                          {formatINR(payment.amount)}
                        </td>
                        <td className="px-8 py-4 text-sm text-locked-muted">
                          {formatBillingCycle(payment.billingCycle || client.billingCycle)}
                        </td>
                        <td className="px-8 py-4 text-xs text-locked-muted">
                          {payment.provider === "MANUAL_CASH" ? (
                            <>
                              <div className="font-medium text-locked-text">Cash</div>
                              <div className="font-mono">Reference: {payment.transactionId || "—"}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-locked-text">Cashfree</div>
                              <div className="font-mono">Order: {payment.cashfreeOrderId || "—"}</div>
                              <div className="font-mono">Payment: {payment.cashfreePaymentId || "—"}</div>
                            </>
                          )}
                        </td>
                        <td className="px-8 py-4 text-sm text-locked-muted">
                          {payment.paidAt ? format(payment.paidAt, "MMM d, yyyy HH:mm") : "Pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-locked-muted/80">
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
              {client.admins.map((admin) => (
                <div key={admin.id} className="p-4 rounded-2xl bg-locked-panel-solid/70 border border-locked-border">
                  <div className="font-bold text-sm text-locked-text truncate">{admin.email}</div>
                  <div className="text-[10px] text-locked-muted uppercase mt-1">Client Admin</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Phone size={18} className="text-brand-blue" /> Contact Information
            </h2>
            <form action={updateClientPhone} className="flex flex-col gap-3">
              <div className="text-xs text-locked-muted">Update WhatsApp number (include country code)</div>
              <input type="hidden" name="clientId" value={client.id} />
              <div className="flex gap-2">
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  defaultValue={client.phoneNumber || ""} 
                  placeholder="+1234567890" 
                  className="flex-1 px-4 py-2 bg-locked-panel-solid/70 border border-locked-border rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm"
                />
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-gradient-end hover:from-brand-gradient-end hover:to-brand-blue text-white rounded-xl font-bold transition-all text-sm whitespace-nowrap shadow-md">
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card p-6 rounded-3xl bg-red-500/5 border-red-500/20">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-locked-muted mb-4">
              Suspension will immediately trigger the remote &quot;Kill Switch&quot; on the client website.
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
