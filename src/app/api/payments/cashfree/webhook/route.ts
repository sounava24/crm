import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { updateCashfreePaymentFromStatus } from "@/lib/payment-updates";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!verifyCashfreeWebhookSignature({ rawBody, signature, timestamp })) {
    return NextResponse.json({ error: "Invalid Cashfree signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const order = payload?.data?.order || payload?.order || {};
  const payment = payload?.data?.payment || payload?.payment || {};
  const eventId =
    payload?.event_id ||
    payload?.eventId ||
    payload?.cf_event_id ||
    `${order.order_id || payload?.order_id || "unknown"}:${payload?.type || payload?.event || "event"}`;
  const orderId = order.order_id || payload?.order_id;

  if (!orderId) {
    return NextResponse.json({ error: "Missing Cashfree order id" }, { status: 400 });
  }

  await updateCashfreePaymentFromStatus({
    orderId,
    orderStatus: order.order_status,
    paymentStatus: payment.payment_status,
    cashfreePaymentId: payment.cf_payment_id ? String(payment.cf_payment_id) : undefined,
    referenceId:
      payment.bank_reference ||
      payment.gateway_payment_id ||
      payment.auth_id ||
      order.cf_order_id,
    webhookEventId: String(eventId),
    rawProviderStatus: payload,
  });

  return NextResponse.json({ success: true });
}
