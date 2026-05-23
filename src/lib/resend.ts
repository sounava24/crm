import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const RESEND_TEST_DOMAIN_MESSAGE =
  "Resend test domain can only send to the owner email. Verify dmstacklabs.in in Resend and use noreply@dmstacklabs.in for real client emails.";

function isResendTestingDomainRestriction(message: string) {
  return (
    message.includes("You can only send testing emails to your own email address") ||
    message.includes("verify a domain at resend.com/domains")
  );
}

export async function sendResendEmail({ to, subject, text, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "DM Stack Labs <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    console.error("Resend email error:", result.error);
    const message = result.error.message || "Unable to send email.";
    throw new Error(
      isResendTestingDomainRestriction(message)
        ? `${RESEND_TEST_DOMAIN_MESSAGE} Resend said: ${message}`
        : message
    );
  }

  return result.data;
}
