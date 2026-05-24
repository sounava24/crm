import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing" },
        { status: 500 }
      );
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { error: "RESEND_FROM_EMAIL is missing" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: ["delivered@resend.dev"],
      subject: "DM Stack Labs Resend Test",
      html: "<p>Resend test email is working.</p>",
    });

    console.log("Resend test result:", result);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: unknown) {
    console.error("Resend test route failed:", error);
    return NextResponse.json(
      {
        error: "Resend test route failed",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
