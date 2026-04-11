import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";
import { AlertCircle, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  return (
    <div className="relative">
      {/* Strict Lockdown Modal */}
      {isOverdue && (
        <div className="fixed flex md:pl-64 inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md items-center justify-center p-6 transition-all">
          <div className="glass-card max-w-lg w-full p-8 rounded-3xl border border-red-500/30 bg-white/90 dark:bg-slate-900/90 shadow-2xl shadow-red-500/20 text-center animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="drop-shadow-lg" />
            </div>
            
            <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Strict Lockout</h2>
            <p className="text-lg text-slate-500 mb-6 font-medium">Your CRM access has been restricted.</p>
            
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Account Deficit</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{daysOverdue} {daysOverdue === 1 ? 'Day' : 'Days'} Overdue</span>
              </div>
              <p className="text-sm text-red-800/70 dark:text-red-300">
                You have exceeded the official grace period for your billing cycle. In accordance with your SLA, all dashboard management, configuration tools, and analytics have been disabled.
              </p>
            </div>
            
            <Link 
              href={`/pay/${client.id}`}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/25 transition-all outline-none"
            >
              Clear Lifetime Dues <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      )}

      {/* Standard Rendered Content (Will be naturally blurred/locked by the modal overlay) */}
      <div className={`space-y-8 animate-fade-in max-w-4xl ${isOverdue ? 'pointer-events-none opacity-50 blur-sm' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {client.name}</h1>
          <p className="text-slate-500 mt-1">Manage your subscription and view your account details.</p>
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
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Account Status</div>
            <div className="flex items-center gap-3">
              {client.status === "active" ? (
                <>
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">Active</div>
                    <div className="text-sm text-slate-500">All systems operational</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">Suspended</div>
                    <div className="text-sm text-slate-500">Action required</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Next Payment Date</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {format(nextPaymentDate, "MMMM d, yyyy")}
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
               <Link 
                href={`/pay/${client.id}`}
                className="flex items-center justify-between w-full p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-all font-bold group shadow-lg shadow-black/10"
              >
                <span>{isSuspended || isOverdue ? "Clear Outstanding Dues" : "Make Early Payment"}</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-3xl overflow-hidden relative">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-4 px-4">
            Live Website Status
          </div>
          <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/5 relative">
            <div className="absolute inset-x-0 top-0 h-10 bg-slate-200 dark:bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-300 dark:border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <div className="ml-4 flex-1 bg-white dark:bg-slate-900 rounded-md py-1 px-3 text-xs text-slate-500 truncate text-center">
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
