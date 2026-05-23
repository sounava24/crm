import { VerifyPaymentClient } from "./verify-payment-client";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; orderId?: string }>;
}) {
  const params = await searchParams;
  return <VerifyPaymentClient orderId={params.order_id || params.orderId} />;
}
