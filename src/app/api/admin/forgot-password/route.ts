import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { sendTransactionalEmail } from "@/lib/email/email-provider";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function genericResponse(emailStatus: "SENT" | "NOT_CONFIGURED" | "NOT_AUTHORISED" | "FAILED" | "NO_CODE") {
  return NextResponse.json({
    ok: true,
    message: "If this email is authorised, we'll send admin access instructions.",
    emailStatus,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return genericResponse("NOT_AUTHORISED");

  const allowedEmails = parsePlatformAdminEmails();
  if (!allowedEmails.includes(email)) return genericResponse("NOT_AUTHORISED");

  const accessCode = process.env.PLATFORM_ADMIN_ACCESS_CODE?.trim();
  if (!accessCode) return genericResponse("NO_CODE");

  const siteUrl = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") || "https://myexperiment.club";
  const loginUrl = `${siteUrl}/admin/login`;
  const subject = "MyExperiment.club platform admin access instructions";
  const text = [
    "MyExperiment.club platform admin access instructions",
    "",
    `Admin login: ${loginUrl}`,
    `Email: ${email}`,
    `Password: ${accessCode}`,
    "",
    "Keep this password private. Platform admin access is separate from subscriber business admin and staff access.",
    "If you did not request this, please review platform admin access immediately.",
  ].join("\n");
  const html = `<p><strong>MyExperiment.club platform admin access instructions</strong></p>
<p>Admin login: <a href="${loginUrl}">${loginUrl}</a></p>
<p>Email: ${email}</p>
<p>Password: <strong>${accessCode}</strong></p>
<p>Keep this password private. Platform admin access is separate from subscriber business admin and staff access.</p>
<p>If you did not request this, please review platform admin access immediately.</p>`;

  const result = await sendTransactionalEmail({ to: email, subject, text, html });
  if (result.ok) return genericResponse("SENT");
  if (result.skipped) return genericResponse("NOT_CONFIGURED");
  return genericResponse("FAILED");
}
