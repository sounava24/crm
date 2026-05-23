ALTER TABLE "Client"
ADD COLUMN "billingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "billingCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "nextRenewalDate" TIMESTAMP(3),
ADD COLUMN "billingNote" TEXT;

UPDATE "Client"
SET "nextRenewalDate" = "nextPaymentDate"
WHERE "nextRenewalDate" IS NULL;

ALTER TABLE "Payment"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'CASHFREE',
ADD COLUMN "cashfreeOrderId" TEXT,
ADD COLUMN "cashfreePaymentId" TEXT,
ADD COLUMN "cashfreePaymentSessionId" TEXT,
ADD COLUMN "cashfreeReferenceId" TEXT,
ADD COLUMN "cashfreeWebhookEventId" TEXT,
ADD COLUMN "billingCycle" TEXT,
ADD COLUMN "rawProviderStatus" JSONB,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Payment"
SET "currency" = 'INR',
    "provider" = CASE
      WHEN "method" = 'phonepe' THEN 'PHONEPE_LEGACY'
      WHEN "method" = 'manual' THEN 'MANUAL_LEGACY'
      ELSE 'CASHFREE'
    END,
    "cashfreePaymentId" = CASE
      WHEN "method" IS NULL OR "method" = 'cashfree' THEN "transactionId"
      ELSE NULL
    END;

CREATE UNIQUE INDEX "Payment_cashfreeOrderId_key" ON "Payment"("cashfreeOrderId");
CREATE UNIQUE INDEX "Payment_cashfreeWebhookEventId_key" ON "Payment"("cashfreeWebhookEventId");
