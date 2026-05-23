import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";
import { Shield } from "lucide-react";
import { formatBillingCycle } from "@/lib/billing";
import { isSuperAdmin } from "@/lib/authz";
import { AdminPaymentOptions } from "@/components/admin-payment-options";

export const dynamic = "force-dynamic";

export default async function ClientPaymentPage(props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const session = await auth();
  const isAdmin = isSuperAdmin(session?.user || null);
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
  });

  if (!client) {
    notFound();
  }

  const pendingPayment = await prisma.payment.findFirst({
    where: {
      clientId: client.id,
      provider: "CASHFREE",
      status: { in: ["CREATED", "PENDING"] },
    },
  });
  const canPay = Number(client.billingAmount || 0) > 0 && client.billingStatus !== "PAID";

  return (
    <div className="min-h-screen bg-locked-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center mb-6 border border-brand-blue/20 shadow-xl shadow-brand-blue/10">
             <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Secure Checkout</h1>
          <p className="text-locked-muted font-medium">{client.name} Subscription</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/20 border border-locked-border">
          <div className="flex justify-between items-center mb-8 pb-8 border-b border-dashed border-locked-border">
            <div>
              <div className="text-xs font-bold text-locked-muted uppercase tracking-wider mb-1">Status</div>
              <div className="mt-1 text-sm text-locked-muted">
                {formatBillingCycle(client.billingCycle)} billing
              </div>
            </div>
            {client.billingStatus === "PAID" ? (
               <div className="px-3 py-1 bg-brand-blue/10 text-brand-gradient-end font-bold rounded-full text-xs">PAID</div>
            ) : (
               <div className="px-3 py-1 bg-amber-500/10 text-amber-400 font-bold rounded-full text-xs">{client.billingStatus}</div>
            )}
          </div>

          {!isAdmin && pendingPayment ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-20 h-20 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-locked-text">Payment Under Review</h3>
              <p className="text-locked-muted text-sm leading-relaxed mb-4">
                We are currently verifying your Cashfree payment. Once confirmed, your account will instantly reactivate.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-locked-panel-solid rounded-xl text-xs font-mono text-locked-muted">
                Cashfree Order: {pendingPayment.cashfreeOrderId || pendingPayment.id}
              </div>
            </div>
          ) : isAdmin ? (
            <AdminPaymentOptions
              clientId={client.id}
              amount={client.billingAmount}
              billingCycle={client.billingCycle}
              canPay={canPay}
            />
          ) : (
            <PaymentForm
              amount={client.billingAmount}
              billingCycle={client.billingCycle}
              canPay={canPay}
            />
          )}
        </div>
        
        <p className="text-center text-xs text-locked-muted/80 mt-8 font-medium">
          Powered by DM Stack Labs Cashfree Payment Infrastructure
        </p>
      </div>
    </div>
  );
}
