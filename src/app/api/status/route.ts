import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Remote Status API
 * Allows client websites to check if they are suspended or active.
 * Security: Production requires X-API-KEY with a client API key, or
 * X-Status-Api-Key with STATUS_API_KEY for controlled operational checks.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const apiKey = req.headers.get("x-api-key");
  const statusApiKey = req.headers.get("x-status-api-key");
  const isProduction = process.env.NODE_ENV === "production";
  const hasValidStatusKey = !!process.env.STATUS_API_KEY && statusApiKey === process.env.STATUS_API_KEY;

  if (!apiKey && !hasValidStatusKey && (isProduction || !domain)) {
    return NextResponse.json(
      { error: "Authorized status lookup is required" },
      { status: 401 }
    );
  }

  try {
    let client;

    if (apiKey) {
      client = await prisma.client.findUnique({
        where: { apiKey },
      });
    } else if (!isProduction || hasValidStatusKey) {
      if (!domain) {
        return NextResponse.json({ error: "Domain is required for this lookup" }, { status: 400 });
      }

      // Domain fallback is development-only unless STATUS_API_KEY is supplied.
      client = await prisma.client.findFirst({
        where: {
          websiteUrl: { contains: domain },
        },
      });
    }

    if (!client) {
      return NextResponse.json({ 
        status: "active", 
        message: "Not found in CRM, defaulting to active for safety" 
      });
    }

    return NextResponse.json({
      status: client.status,
      isExpired: new Date() > client.nextPaymentDate,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Status API error:", error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
