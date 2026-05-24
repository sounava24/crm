import { handlers } from "@/auth";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname.includes("/callback/credentials")) {
    const formData = await request.clone().formData().catch(() => null);
    const email = String(formData?.get("email") || "unknown").toLowerCase();
    const ip = getClientIp(request.headers);
    const rateLimit = checkRateLimit({
      key: `login:${ip}:${email}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
      );
    }
  }

  return handlers.POST(request);
}
