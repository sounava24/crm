import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Remote Status API
 * Allows client websites to check if they are suspended or active.
 * Security: Supports X-API-KEY header for verification.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const apiKey = req.headers.get("x-api-key");

  if (!domain && !apiKey) {
    return NextResponse.json({ error: "Identification (apiKey or domain) is required" }, { status: 400 });
  }

  try {
    let client;

    if (apiKey) {
      client = await prisma.client.findUnique({
        where: { apiKey },
      });
    } else {
      // Fallback to domain matching (deprecated, use apiKey instead)
      client = await prisma.client.findFirst({
        where: {
          websiteUrl: {
            contains: domain!,
          },
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
      id: client.id,
      name: client.name,
      status: client.status,
      nextPaymentDate: client.nextPaymentDate,
      isExpired: new Date() > client.nextPaymentDate,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
