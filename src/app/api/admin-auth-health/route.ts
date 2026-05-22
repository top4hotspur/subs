import { NextResponse } from "next/server";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function tryParseHost(urlValue: string | undefined): string | null {
  if (!urlValue) return null;
  try {
    return new URL(urlValue).host;
  } catch {
    return null;
  }
}

export async function GET() {
  const authSecretPresent = Boolean(process.env.AUTH_SECRET?.trim());
  const nextAuthSecretPresent = Boolean(process.env.NEXTAUTH_SECRET?.trim());
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  const nextAuthUrlPresent = Boolean(nextAuthUrl);
  const platformAdminEmails = parsePlatformAdminEmails();
  const platformAdminAccessCodeConfigured = Boolean(
    process.env.PLATFORM_ADMIN_ACCESS_CODE?.trim(),
  );

  const ok =
    (authSecretPresent || nextAuthSecretPresent) &&
    nextAuthUrlPresent &&
    platformAdminEmails.length > 0 &&
    platformAdminAccessCodeConfigured;

  return NextResponse.json({
    ok,
    authSecretPresent,
    nextAuthSecretPresent,
    nextAuthUrlPresent,
    platformAdminEmailsConfigured: platformAdminEmails.length > 0,
    platformAdminAccessCodeConfigured,
    allowedAdminCount: platformAdminEmails.length,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    nextAuthUrlHost: tryParseHost(nextAuthUrl),
  });
}
