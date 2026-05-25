import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import {
  createCashfreeOrder,
  getCashfreeClientMode,
  withCashfreeOrderIdReturnParam,
} from "@/lib/cashfree";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

function getBaseUrl(request: Request) {
  const configured = process.env.CASHFREE_RETURN_URL;
  if (configured) return configured.replace(/\/payment-success.*$/, "");

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const ipLimit = checkRateLimit({
    key: `admin-cashfree-order:${getClientIp(request.headers)}`,
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many payment requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(ipLimit.retryAfter) }
    );
  }

  const user = await requireSuperAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { admins: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const amount = Number(client.billingAmount || 0);
  if (amount <= 0 || client.billingStatus === "PAID") {
    return NextResponse.json(
      { error: "No payable billing amount is pending for this client." },
      { status: 400 }
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      clientId: client.id,
      provider: "CASHFREE",
      status: { in: ["CREATED", "PENDING"] },
    },
    orderBy: [{ paidAt: "desc" }, { id: "desc" }],
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
  const returnUrl = withCashfreeOrderIdReturnParam(
    process.env.CASHFREE_RETURN_URL || `${baseUrl}/payment-success`
  );
  const notifyUrl = `${baseUrl}/api/payments/cashfree/webhook`;
  const adminEmail = client.admins[0]?.email || undefined;

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
