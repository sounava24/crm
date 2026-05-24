import crypto from "crypto";

const CASHFREE_API_VERSION = "2025-01-01";

type CashfreeOrderPayload = {
  order_id: string;
  order_amount: number;
  order_currency: "INR";
  customer_details: {
    customer_id: string;
    customer_email?: string;
    customer_phone: string;
    customer_name?: string;
  };
  order_meta: {
    return_url: string;
    notify_url?: string;
  };
  order_note?: string;
};

export function getCashfreeEnvironment() {
  return process.env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function getCashfreeBaseUrl() {
  return getCashfreeEnvironment() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export function getCashfreeClientMode() {
  return getCashfreeEnvironment();
}

function getCashfreeCredentials() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cashfree credentials are not configured.");
  }

  return { clientId, clientSecret };
}

function getCashfreeHeaders() {
  const { clientId, clientSecret } = getCashfreeCredentials();

  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
  };
}

export async function createCashfreeOrder(payload: CashfreeOrderPayload) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: {
      ...getCashfreeHeaders(),
      "x-idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Cashfree order creation failed.");
  }

  return data;
}

export async function getCashfreeOrder(orderId: string) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Cashfree order lookup failed.");
  }

  return data;
}

export async function getCashfreeOrderPayments(orderId: string) {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}/payments`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Cashfree payment lookup failed.");
  }

  return Array.isArray(data) ? data : [];
}

export function verifyCashfreeWebhookSignature({
  rawBody,
  signature,
  timestamp,
}: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
}) {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
  const secret =
    webhookSecret ||
    (process.env.NODE_ENV === "production" ? undefined : process.env.CASHFREE_CLIENT_SECRET);

  if (!webhookSecret && process.env.NODE_ENV !== "production") {
    console.warn("CASHFREE_WEBHOOK_SECRET is not configured; using development fallback.");
  }

  if (!secret || !signature || !timestamp) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
