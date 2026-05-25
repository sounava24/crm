import { VerifyPaymentClient } from "./verify-payment-client";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    order_id?: string | string[];
    orderId?: string | string[];
    cf_order_id?: string | string[];
    payment_id?: string | string[];
    transaction_id?: string | string[];
    status?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const orderId =
    getParamValue(params.order_id) ||
    getParamValue(params.orderId) ||
    getParamValue(params.cf_order_id) ||
    getParamValue(params.payment_id) ||
    getParamValue(params.transaction_id);

  if (process.env.NODE_ENV === "development") {
    console.info("Cashfree payment-success params:", {
      order_id: getParamValue(params.order_id),
      orderId: getParamValue(params.orderId),
      cf_order_id: getParamValue(params.cf_order_id),
      payment_id: getParamValue(params.payment_id),
      transaction_id: getParamValue(params.transaction_id),
      status: getParamValue(params.status),
      selectedOrderId: orderId,
    });
  }

  return <VerifyPaymentClient orderId={orderId} />;
}
