import { NextRequest, NextResponse } from "next/server";
import { autoSuspendOverdueClients } from "@/lib/actions";

/**
 * Auto Kill Switch Cron Route
 * Call this endpoint on a schedule (e.g. daily) to auto-suspend overdue clients.
 *
 * Security: Requires X-Cron-Secret header in production.
 * Local development may use ?secret=CRON_SECRET for manual testing.
 *
 * Example (Vercel Cron, vercel.json):
 *   { "crons": [{ "path": "/api/cron/suspend", "schedule": "0 0 * * *" }] }
 *
 * Example (external cron):
 *   GET https://your-crm.com/api/cron/suspend?secret=YOUR_CRON_SECRET
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  const secretFromQuery = req.nextUrl.searchParams.get("secret");
  const secretFromHeader = req.headers.get("x-cron-secret");
  const provided = secretFromHeader || (!isProduction ? secretFromQuery : null);

  if (!cronSecret || provided !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await autoSuspendOverdueClients();

  return NextResponse.json({
    ok: true,
    message: result.suspended > 0
      ? `Auto-suspended ${result.suspended} overdue client(s).`
      : "No overdue clients found. All good!",
    suspended: result.suspended,
    clients: result.clientNames,
    timestamp: new Date().toISOString(),
  });
}
