import { NextRequest, NextResponse } from "next/server";
import { getCashfreeOrder, getCashfreeOrderPayments, mapCashfreeStatus } from "@/lib/cashfree";
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
    request.nextUrl.searchParams.get("order_id") ||
    request.nextUrl.searchParams.get("cf_order_id") ||
    request.nextUrl.searchParams.get("payment_id") ||
    request.nextUrl.searchParams.get("transaction_id");

  if (!orderId) {
    return NextResponse.json({ error: "Unable to verify payment. Missing Cashfree order ID." }, { status: 400 });
  }

  const localPayment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: orderId },
        { cashfreeOrderId: orderId },
        { cashfreeReferenceId: orderId },
        { cashfreePaymentId: orderId },
        { transactionId: orderId },
      ],
    },
  });

  if (!localPayment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (!isSuperAdmin(user) && localPayment.clientId !== user.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.NODE_ENV === "development") {
    console.info("Cashfree verify request:", {
      receivedOrderId: orderId,
      localPaymentId: localPayment.id,
      cashfreeOrderId: localPayment.cashfreeOrderId,
      localStatus: localPayment.status,
    });
  }

  if (localPayment.status === "PAID") {
    return NextResponse.json({
      orderId: localPayment.cashfreeOrderId || localPayment.id,
      status: "PAID",
      orderStatus: "PAID",
      payment: localPayment,
    });
  }

  const cashfreeOrderId = localPayment.cashfreeOrderId || localPayment.id;
  const [order, orderPayments] = await Promise.all([
    getCashfreeOrder(cashfreeOrderId),
    getCashfreeOrderPayments(cashfreeOrderId).catch(() => []),
  ]);

  const successfulPayment =
    orderPayments.find((payment) => payment.payment_status === "SUCCESS") || orderPayments[0];
  const mappedStatus =
    mapCashfreeStatus(successfulPayment?.payment_status) === "PAID"
      ? "PAID"
      : mapCashfreeStatus(order.order_status || successfulPayment?.payment_status);

  if (process.env.NODE_ENV === "development") {
    console.info("Cashfree verify status:", {
      cashfreeOrderId,
      orderStatus: order.order_status,
      paymentStatus: successfulPayment?.payment_status,
      mappedStatus,
    });
  }

  const updated = await updateCashfreePaymentFromStatus({
    orderId: cashfreeOrderId,
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
    orderId: cashfreeOrderId,
    status: updated?.status || mappedStatus,
    orderStatus: order.order_status,
    payment: updated,
  });
}
