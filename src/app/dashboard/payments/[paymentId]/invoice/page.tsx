import { auth } from "@/auth";
import { PaymentInvoice } from "@/components/payment-invoice";
import { isSuperAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/app/portal/receipts/[paymentId]/invoice/print-button";

export const dynamic = "force-dynamic";

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user)) {
    notFound();
  }

  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      client: {
        include: {
          admins: {
            select: { email: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!payment) {
    notFound();
  }

  const isPaid = payment.status === "PAID";

  return (
    <div className="min-h-screen bg-locked-bg px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/payments"
          className="rounded-xl border border-locked-border bg-locked-panel-solid px-4 py-3 text-sm font-bold text-locked-muted transition-all hover:text-locked-text"
        >
          Back to Payments
        </Link>
        {isPaid && <PrintButton />}
      </div>

      <PaymentInvoice payment={payment} />
    </div>
  );
}
