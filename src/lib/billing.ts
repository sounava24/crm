export const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const;
export const BILLING_STATUSES = ["PENDING", "PAID", "OVERDUE", "SUSPENDED"] as const;
export const PAYMENT_STATUSES = ["CREATED", "PENDING", "PAID", "FAILED", "CANCELLED"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type BillingStatus = (typeof BILLING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function formatBillingCycle(cycle: string | null | undefined) {
  switch (cycle) {
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "YEARLY":
      return "Yearly";
    case "ONE_TIME":
      return "One-time";
    default:
      return "Monthly";
  }
}

export function getNextRenewalDate(from: Date, cycle: string | null | undefined) {
  const next = new Date(from);

  switch (cycle) {
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      return next;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      return next;
    case "ONE_TIME":
      return from;
    case "MONTHLY":
    default:
      next.setMonth(next.getMonth() + 1);
      return next;
  }
}

export function normalizeBillingStatus(status: string | null | undefined) {
  const normalized = (status || "PENDING").toUpperCase();
  return BILLING_STATUSES.includes(normalized as BillingStatus)
    ? (normalized as BillingStatus)
    : "PENDING";
}

export function normalizePaymentStatus(status: string | null | undefined) {
  const normalized = (status || "PENDING").toUpperCase();
  if (normalized === "SUCCESS") return "PAID";
  if (normalized === "USER_DROPPED") return "CANCELLED";
  return PAYMENT_STATUSES.includes(normalized as PaymentStatus)
    ? (normalized as PaymentStatus)
    : "PENDING";
}
