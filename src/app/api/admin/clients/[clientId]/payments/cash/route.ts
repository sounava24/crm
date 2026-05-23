import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import { activateClientForPaidPayment } from "@/lib/payment-updates";

const CashPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paidAt: z.string().min(1),
  reference: z.string().trim().max(240).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireSuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = CashPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid cash payment payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const paidAt = new Date(parsed.data.paidAt);
  if (Number.isNaN(paidAt.getTime())) {
    return NextResponse.json({ error: "Invalid payment date" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        clientId,
        amount: parsed.data.amount,
        currency: "INR",
        status: "PAID",
        provider: "MANUAL_CASH",
        method: "cash",
        transactionId: parsed.data.reference || null,
        billingCycle: client.billingCycle,
        paidAt,
      },
    });

    await activateClientForPaidPayment(tx, client);
    return createdPayment;
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  revalidatePath("/portal");

  return NextResponse.json({ payment });
}
