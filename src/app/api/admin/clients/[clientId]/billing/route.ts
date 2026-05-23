import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import { BILLING_CYCLES, BILLING_STATUSES } from "@/lib/billing";

const BillingSchema = z.object({
  billingAmount: z.coerce.number().min(0),
  billingCycle: z.enum(BILLING_CYCLES),
  nextRenewalDate: z.string().min(1),
  billingStatus: z.enum(BILLING_STATUSES),
  billingNote: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireSuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = BillingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid billing payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const nextRenewalDate = new Date(parsed.data.nextRenewalDate);
  if (Number.isNaN(nextRenewalDate.getTime())) {
    return NextResponse.json({ error: "Invalid renewal date" }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      billingAmount: parsed.data.billingAmount,
      billingCurrency: "INR",
      billingCycle: parsed.data.billingCycle,
      billingStatus: parsed.data.billingStatus,
      billingNote: parsed.data.billingNote || null,
      nextRenewalDate,
      nextPaymentDate: nextRenewalDate,
      status: parsed.data.billingStatus === "SUSPENDED" ? "suspended" : "active",
    },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/payments");
  revalidatePath("/portal");

  return NextResponse.json({ client });
}
