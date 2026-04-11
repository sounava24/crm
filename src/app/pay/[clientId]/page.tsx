import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientPaymentPage(props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
  });

  if (!client) {
    notFound();
  }

  const pendingPayment = await prisma.payment.findFirst({
    where: { clientId: client.id, status: "pending" },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
             <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Secure Checkout</h1>
          <p className="text-slate-500 font-medium">{client.name} Subscription</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex justify-between items-center mb-8 pb-8 border-b border-dashed border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</div>
            </div>
            {client.status === "active" ? (
               <div className="px-3 py-1 bg-emerald-500/10 text-emerald-600 font-bold rounded-full text-xs">ACTIVE</div>
            ) : (
               <div className="px-3 py-1 bg-red-500/10 text-red-600 font-bold rounded-full text-xs">SUSPENDED</div>
            )}
          </div>

          {pendingPayment ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Payment Under Review</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                We are currently verifying your manual payment. Once verified, your account will instantly reactivate.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-mono text-slate-500">
                UTR: {pendingPayment.transactionId}
              </div>
            </div>
          ) : (
            <PaymentForm clientId={client.id} />
          )}
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Powered by Nexus CRM Payment Infrastructure &middot; Zero Fees
        </p>
      </div>
    </div>
  );
}
