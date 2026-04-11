import crypto from "crypto";

// PhonePe Sandbox/UAT Default Credentials
export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86";
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || "96434309-7796-489d-8924-ab56988a6076";
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
export const PHONEPE_HOST = process.env.PHONEPE_HOST || "https://api-preprod.phonepe.com/apis/pg-sandbox";

/**
 * Encodes JSON payload to Base64
 */
export function encodePayload(payload: Record<string, any>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Generates X-VERIFY checksum
 */
export function generateChecksum(base64Payload: string, apiEndpoint: string): string {
  const stringToSign = base64Payload + apiEndpoint + PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
  return `${sha256}###${PHONEPE_SALT_INDEX}`;
}

/**
 * Verifies S2S Webhook checksum
 */
export function verifyChecksum(base64Response: string, providedChecksum: string): boolean {
  const expectedChecksum = generateChecksum(base64Response, "");
  return expectedChecksum === providedChecksum;
}
