import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/authz";
import { createCashfreeOrder, getCashfreeClientMode } from "@/lib/cashfree";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

function getBaseUrl(request: Request) {
  const configured = process.env.CASHFREE_RETURN_URL;
  if (configured) return configured.replace(/\/payment-success.*$/, "");

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const ipLimit = checkRateLimit({
    key: `client-cashfree-order:${getClientIp(request.headers)}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many payment requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(ipLimit.retryAfter) }
    );
  }

  const user = await requireClientUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: user.clientId },
    include: { admins: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const amount = Number(client.billingAmount || 0);
  const billingStatus = (client.billingStatus || "PENDING").toUpperCase();
  const canPay = amount > 0 && billingStatus !== "PAID";

  if (!canPay) {
    return NextResponse.json(
      { error: "No payable billing amount is pending for this account." },
      { status: 400 }
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      clientId: client.id,
      provider: "CASHFREE",
      status: { in: ["CREATED", "PENDING"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment?.cashfreePaymentSessionId && existingPayment.cashfreeOrderId) {
    return NextResponse.json({
      orderId: existingPayment.cashfreeOrderId,
      paymentSessionId: existingPayment.cashfreePaymentSessionId,
      mode: getCashfreeClientMode(),
    });
  }

  const localPayment = await prisma.payment.create({
    data: {
      clientId: client.id,
      amount,
      currency: "INR",
      status: "CREATED",
      provider: "CASHFREE",
      billingCycle: client.billingCycle,
    },
  });

  const orderId = localPayment.id;
  const baseUrl = getBaseUrl(request);
  const returnUrl =
    process.env.CASHFREE_RETURN_URL || `${baseUrl}/payment-success?order_id={order_id}`;
  const notifyUrl = `${baseUrl}/api/payments/cashfree/webhook`;
  const adminEmail = user.email || client.admins[0]?.email || undefined;

  const order = await createCashfreeOrder({
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: client.id,
      customer_email: adminEmail,
      customer_phone: client.phoneNumber || "9999999999",
      customer_name: client.name,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
    order_note: `${client.name} ${client.billingCycle} billing`,
  });

  const payment = await prisma.payment.update({
    where: { id: localPayment.id },
    data: {
      status: "PENDING",
      cashfreeOrderId: order.order_id || orderId,
      cashfreePaymentSessionId: order.payment_session_id,
      cashfreeReferenceId: String(order.cf_order_id || ""),
      rawProviderStatus: order,
    },
  });

  return NextResponse.json({
    orderId: payment.cashfreeOrderId,
    paymentSessionId: payment.cashfreePaymentSessionId,
    mode: getCashfreeClientMode(),
  });
}
