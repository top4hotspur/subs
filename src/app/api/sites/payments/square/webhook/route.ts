import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: "TENANT_SQUARE_WEBHOOK_NOT_IMPLEMENTED",
    message:
      "Subscriber Square payment webhooks must verify Square signatures, resolve tenant booking IDs, enforce idempotency and remain separate from platform subscription webhooks before processing.",
  }, { status: 501 });
}
