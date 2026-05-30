import { NextResponse } from "next/server";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export async function POST() {
  const webhookSecretConfigured = Boolean(getOptionalServerEnv("RESEND_WEBHOOK_SECRET"));

  return NextResponse.json(
    {
      ok: false,
      error: "WEBHOOK_VERIFICATION_NOT_IMPLEMENTED",
      webhookSecretConfigured,
      message:
        "Resend webhook verification is required before processing campaign events. Unverified webhooks are not accepted in production.",
    },
    { status: 501 },
  );
}
