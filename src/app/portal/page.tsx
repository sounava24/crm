import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { CashfreePayButton } from "@/components/cashfree-pay-button";
import { formatINR } from "@/lib/currency";
import { formatBillingCycle } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function PortalOverviewPage() {
  const session = await auth();
  if (!session?.user?.clientId) {
    redirect("/login");
  }

  const clientId = session.user.clientId;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return <div>Client not found.</div>;
  }

  const isSuspended = client.status !== "active";
  const nextPaymentDate = new Date(client.nextPaymentDate);
  const isOverdue = new Date() > nextPaymentDate;
  const daysOverdue = isOverdue ? differenceInDays(new Date(), nextPaymentDate) : 0;
  const billingStatus = client.billingStatus || (isOverdue ? "OVERDUE" : "PENDING");
  const canPay = Number(client.billingAmount || 0) > 0 && billingStatus !== "PAID";

  return (
    <div className="relative">
      {/* Strict Lockdown Modal */}
      {isOverdue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-locked-bg/75 p-6 backdrop-blur-md transition-all">
          <div className="glass-card relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/30 bg-locked-panel-solid/90 p-8 text-center shadow-2xl shadow-red-500/20 animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="drop-shadow-lg" />
            </div>
            
            <h2 className="text-3xl font-black mb-2 text-locked-text">Strict Lockout</h2>
            <p className="text-lg text-locked-muted mb-6 font-medium">Your CRM access has been restricted.</p>
            
            <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Account Deficit</span>
                <span className="text-sm font-bold text-locked-text">{daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue</span>
              </div>
              <p className="text-sm text-red-300">
                You have exceeded the official grace period for your billing cycle. In accordance with your SLA, all dashboard management, configuration tools, and analytics have been disabled.
              </p>
            </div>
            
            <CashfreePayButton label="Clear Outstanding Dues" disabled={!canPay} />
          </div>
        </div>
      )}

      {/* Standard Rendered Content (Will be naturally blurred/locked by the modal overlay) */}
      <div className={`space-y-8 animate-fade-in max-w-4xl ${isOverdue ? 'pointer-events-none opacity-50 blur-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {client.name}</h1>
          <p className="text-locked-muted mt-1">Manage your subscription and view your account details.</p>
        </div>

        {isSuspended && !isOverdue && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-600 dark:text-red-400">Account Suspended</h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                Your access has been temporarily suspended due to pending payments. Please clear your dues to instantly reactivate your account.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-locked-border">
            <div className="text-sm font-bold text-locked-muted uppercase tracking-wider mb-4">Account Status</div>
            <div className="flex items-center gap-3">
              {client.status === "active" ? (
                <>
                  <div className="w-12 h-12 bg-brand-blue/10 text-brand-gradient-end rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-locked-text">Active</div>
                    <div className="text-sm text-locked-muted">All systems operational</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-locked-text">Suspended</div>
                    <div className="text-sm text-locked-muted">Action required</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-locked-border flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-locked-muted uppercase tracking-wider mb-2">Next Payment Date</div>
              <div className="text-2xl font-black text-locked-text">
                {format(nextPaymentDate, "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="mt-6 border-t border-locked-border pt-6">
              <CashfreePayButton
                label={isSuspended || isOverdue ? "Clear Outstanding Dues" : "Make Early Payment"}
                disabled={!canPay}
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-locked-border">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-bold text-locked-muted uppercase tracking-wider mb-2">
                Billing & Payment
              </div>
              <div className="text-3xl font-black text-locked-text">
                {formatINR(client.billingAmount)}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold uppercase">
                <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-brand-gradient-end">
                  {formatBillingCycle(client.billingCycle)}
                </span>
                <span className="rounded-full bg-locked-panel-solid px-3 py-1 text-locked-muted">
                  {billingStatus}
                </span>
              </div>
              <p className="mt-3 text-sm text-locked-muted">
                Due date: {format(client.nextRenewalDate || nextPaymentDate, "MMMM d, yyyy")}
              </p>
            </div>
            <div className="w-full md:w-60">
              {canPay ? (
                <CashfreePayButton />
              ) : (
                <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-5 py-4 text-center font-bold text-brand-gradient-end">
                  Paid
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-3xl overflow-hidden relative">
          <div className="flex items-center gap-2 text-sm font-bold text-locked-muted mb-4 px-4">
            Live Website Status
          </div>
          <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-locked-border bg-locked-bg/40 relative">
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
      </div>
    </div>
  );
}
