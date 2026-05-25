import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendResendEmail } from "@/lib/resend";
import {
  addMinutes,
  createOtpCode,
  getAuthenticatedSuperAdmin,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
} from "@/lib/admin-password-otp";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = checkRateLimit({
      key: `admin-otp-send-ip:${ip}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification code requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(ipLimit.retryAfter) }
      );
    }

    const admin = await getAuthenticatedSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sendWindowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const latestToken = await prisma.otpToken.findFirst({
      where: {
        email: admin.email,
        userId: admin.id,
        purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
      },
      orderBy: { createdAt: "desc" },
    });

    if (
      latestToken &&
      now.getTime() - latestToken.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return NextResponse.json(
        { error: "Please wait before requesting another code.", retryAfter: OTP_RESEND_COOLDOWN_SECONDS },
        { status: 429 }
      );
    }

    const recentSendCount = await prisma.otpToken.count({
      where: {
        email: admin.email,
        userId: admin.id,
        purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
        createdAt: { gte: sendWindowStart },
      },
    });

    if (recentSendCount >= 5) {
      return NextResponse.json(
        { error: "Too many verification code requests. Please try again later." },
        { status: 429 }
      );
    }

    const code = createOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = addMinutes(now, OTP_EXPIRY_MINUTES);

    await prisma.$transaction([
      prisma.otpToken.updateMany({
        where: {
          email: admin.email,
          userId: admin.id,
          purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
      prisma.otpToken.create({
        data: {
          email: admin.email,
          userId: admin.id,
          purpose: SUPER_ADMIN_PASSWORD_CHANGE_PURPOSE,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    await sendResendEmail({
      to: admin.email,
      subject: "DM Stack Labs Super Admin Password Verification Code",
      text: [
        "Hello,",
        "",
        `Your DM Stack Labs Super Admin password verification code is: ${code}`,
        "",
        "This code expires in 10 minutes.",
        "If you did not request this, you can safely ignore this email.",
        "",
        "DM Stack Labs",
      ].join("\n"),
      html: `
        <p>Hello,</p>
        <p>Your DM Stack Labs Super Admin password verification code is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>DM Stack Labs</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Super Admin password OTP send-code route failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        error: "Unable to send verification code",
        debug:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
