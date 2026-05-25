import { prisma } from "@/lib/prisma";
import { getNextRenewalDate, normalizePaymentStatus } from "@/lib/billing";
import { mapCashfreeStatus } from "@/lib/cashfree";
import { Prisma } from "@prisma/client";

type ProviderPayload = Prisma.InputJsonObject;

export async function activateClientForPaidPayment(
  tx: Prisma.TransactionClient,
  client: {
    id: string;
    billingCycle: string | null;
    nextRenewalDate: Date | null;
    nextPaymentDate: Date;
  }
) {
  const renewalBase = client.nextRenewalDate || client.nextPaymentDate || new Date();
  const nextRenewalDate =
    client.billingCycle === "ONE_TIME"
      ? renewalBase
      : getNextRenewalDate(new Date(), client.billingCycle);

  await tx.client.update({
    where: { id: client.id },
    data: {
      status: "active",
      billingStatus: "PAID",
      nextRenewalDate,
      nextPaymentDate: nextRenewalDate,
    },
  });

  return nextRenewalDate;
}

export async function updateCashfreePaymentFromStatus({
  orderId,
  orderStatus,
  paymentStatus,
  cashfreePaymentId,
  referenceId,
  webhookEventId,
  rawProviderStatus,
}: {
  orderId: string;
  orderStatus?: string | null;
  paymentStatus?: string | null;
  cashfreePaymentId?: string | null;
  referenceId?: string | null;
  webhookEventId?: string | null;
  rawProviderStatus?: ProviderPayload;
}) {
  const mappedStatus =
    mapCashfreeStatus(paymentStatus) === "PAID"
      ? "PAID"
      : mapCashfreeStatus(orderStatus || paymentStatus);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        OR: [{ id: orderId }, { cashfreeOrderId: orderId }],
      },
      include: { client: true },
    });

    if (!payment) {
      return null;
    }

    if (payment.status === "PAID") {
      return payment;
    }

    const data: Prisma.PaymentUpdateInput = {
      status: normalizePaymentStatus(mappedStatus),
      cashfreePaymentId: cashfreePaymentId || payment.cashfreePaymentId,
      cashfreeReferenceId: referenceId || payment.cashfreeReferenceId,
      cashfreeWebhookEventId: webhookEventId || payment.cashfreeWebhookEventId,
      paidAt: mappedStatus === "PAID" ? payment.paidAt || new Date() : payment.paidAt,
    };

    if (rawProviderStatus) {
      data.rawProviderStatus = rawProviderStatus;
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data,
    });

    if (mappedStatus === "PAID" && payment.status !== "PAID") {
      await activateClientForPaidPayment(tx, payment.client);
    }

    if (mappedStatus === "FAILED" || mappedStatus === "CANCELLED") {
      await tx.client.update({
        where: { id: payment.clientId },
        data: { billingStatus: "PENDING" },
      });
    }

    return updatedPayment;
  });
}
