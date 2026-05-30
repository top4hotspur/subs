import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/email/email-provider";
import { getOptionalServerEnv } from "@/lib/config/server-env";

function parseFromDomain(from?: string): string | null {
  if (!from) return null;
  const match = from.match(/<([^>]+)>/);
  const email = (match?.[1] ?? from).trim();
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

export async function GET() {
  const resendApiKey = getOptionalServerEnv("RESEND_API_KEY");
  const emailFrom = getOptionalServerEnv("EMAIL_FROM");
  const notificationEmail = getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL");

  const resendApiKeyPresent = Boolean(resendApiKey);
  const emailFromPresent = Boolean(emailFrom);
  const platformNotificationEmailPresent = Boolean(notificationEmail);
  const emailConfigured = isEmailConfigured();

  return NextResponse.json({
    ok: true,
    resendApiKeyPresent,
    emailFromPresent,
    platformNotificationEmailPresent,
    emailConfigured,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    fromDomain: parseFromDomain(emailFrom),
  });
}
