import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: "TENANT_STRIPE_WEBHOOK_NOT_IMPLEMENTED",
    message:
      "Subscriber Stripe payment webhooks must verify Stripe signatures, resolve tenant booking IDs, enforce idempotency and remain separate from platform subscription webhooks before processing.",
  }, { status: 501 });
}
