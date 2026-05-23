import { prisma } from "@/lib/prisma";
import { requireClientUser } from "@/lib/authz";

export const CLIENT_PASSWORD_CHANGE_PURPOSE = "CLIENT_PASSWORD_CHANGE";
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export async function getAuthenticatedClientAdmin() {
  const user = await requireClientUser();
  if (!user?.id || !user.email || !user.clientId) {
    return null;
  }

  return prisma.admin.findFirst({
    where: {
      id: user.id,
      email: user.email,
      clientId: user.clientId,
    },
    select: {
      id: true,
      email: true,
      clientId: true,
    },
  });
}

export function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
