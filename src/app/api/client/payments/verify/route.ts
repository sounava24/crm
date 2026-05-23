import { NextRequest, NextResponse } from "next/server";
import { getCashfreeOrder, getCashfreeOrderPayments } from "@/lib/cashfree";
import { updateCashfreePaymentFromStatus } from "@/lib/payment-updates";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isSuperAdmin } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId =
    request.nextUrl.searchParams.get("orderId") ||
    request.nextUrl.searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const localPayment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: orderId }, { cashfreeOrderId: orderId }],
    },
  });

  if (!localPayment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!isSuperAdmin(user) && localPayment.clientId !== user.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [order, orderPayments] = await Promise.all([
    getCashfreeOrder(orderId),
    getCashfreeOrderPayments(orderId).catch(() => []),
  ]);

  const successfulPayment =
    orderPayments.find((payment) => payment.payment_status === "SUCCESS") || orderPayments[0];

  const updated = await updateCashfreePaymentFromStatus({
    orderId,
    orderStatus: order.order_status,
    paymentStatus: successfulPayment?.payment_status,
    cashfreePaymentId: successfulPayment?.cf_payment_id
      ? String(successfulPayment.cf_payment_id)
      : undefined,
    referenceId:
      successfulPayment?.bank_reference ||
      successfulPayment?.auth_id ||
      successfulPayment?.gateway_payment_id ||
      order.cf_order_id,
    rawProviderStatus: { order, payments: orderPayments },
  });

  return NextResponse.json({
    orderId,
    status: updated?.status || "PENDING",
    orderStatus: order.order_status,
    payment: updated,
  });
}
