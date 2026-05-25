import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/authz";
import {
  addMinutes,
  createOtpCode,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/client-password-otp";

export const SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE = "SUPER_ADMIN_PASSWORD_CHANGE";

export async function getAuthenticatedSuperAdmin() {
  const user = await requireSuperAdmin();
  if (!user?.id || !user.email) {
    return null;
  }

  return prisma.admin.findFirst({
    where: {
      id: user.id,
      email: user.email,
    },
    select: {
      id: true,
      email: true,
      clientId: true,
    },
  });
}

export { addMinutes, createOtpCode, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS };
