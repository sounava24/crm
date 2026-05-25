import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedSuperAdmin,
  SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
} from "@/lib/admin-password-otp";
import { getStrongPasswordError, validateStrongPassword } from "@/lib/password-policy";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

const UpdatePasswordSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

export async function POST(request: Request) {
  const ipLimit = checkRateLimit({
    key: `admin-otp-update-ip:${getClientIp(request.headers)}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(ipLimit.retryAfter) }
    );
  }

  const admin = await getAuthenticatedSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdatePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a 6-digit code and a valid new password." },
      { status: 400 }
    );
  }

  const { code, newPassword, confirmPassword } = parsed.data;
  const passwordValidation = validateStrongPassword(newPassword);
  if (!passwordValidation.valid) {
    return NextResponse.json({ error: getStrongPasswordError(newPassword) }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  const now = new Date();
  const attemptWindowStart = new Date(now.getTime() - 10 * 60 * 1000);
  const recentAttempts = await prisma.otpToken.aggregate({
    where: {
      email: admin.email,
      userId: admin.id,
      purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
      createdAt: { gte: attemptWindowStart },
    },
    _sum: { attempts: true },
  });

  if ((recentAttempts._sum.attempts || 0) >= 10) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please request a new code later." },
      { status: 429 }
    );
  }

  const token = await prisma.otpToken.findFirst({
    where: {
      email: admin.email,
      userId: admin.id,
      purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token || token.expiresAt < now) {
    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  const codeMatches = await bcrypt.compare(code, token.codeHash);
  if (!codeMatches) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: {
        attempts: { increment: 1 },
        usedAt: token.attempts + 1 >= 10 ? now : undefined,
      },
    });

    return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    }),
    prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    }),
    prisma.otpToken.updateMany({
      where: {
        email: admin.email,
        userId: admin.id,
        purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
        usedAt: null,
        id: { not: token.id },
      },
      data: { usedAt: now },
    }),
  ]);

  return NextResponse.json({ success: true });
}
