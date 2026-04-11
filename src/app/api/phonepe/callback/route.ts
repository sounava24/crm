import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyChecksum } from "@/lib/phonepe";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const headers = req.headers;
    const xVerify = headers.get("x-verify") || headers.get("X-VERIFY");

    if (!xVerify || !rawBody.response) {
      return NextResponse.json({ error: "Invalid Callback payload" }, { status: 400 });
    }

    // 1. Verify standard Checksum
    const isValid = verifyChecksum(rawBody.response, xVerify);
    if (!isValid) {
      console.error("PhonePe Checksum Validation Failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Decode the Base64 response
    const decodedString = Buffer.from(rawBody.response, "base64").toString("utf-8");
    const parsedData = JSON.parse(decodedString);

    // 3. Process the Payment Status
    if (parsedData.code === "PAYMENT_SUCCESS" && parsedData.data) {
      const transactionId = parsedData.data.merchantTransactionId;

      // Use a transaction to ensure both payment and client update together
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { transactionId: transactionId },
        });

        if (payment && payment.status !== "paid") {
          // Mark payment as paid
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "paid", paidAt: new Date() },
          });

          // Instantly activate the Client Software
          await tx.client.update({
            where: { id: payment.clientId },
            data: {
              status: "active",
              nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      });
    }

    // Always return 200 OK to PhonePe so they stop retrying
    return NextResponse.json({ success: true, message: "Callback processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
