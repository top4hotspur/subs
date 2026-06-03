import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { verifyPaymentConnectState } from "@/lib/sites/payment-provider-connections";

export async function GET(request: Request) {
  const session = await getSiteAdminSessionContext();
  if (!session) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code");
  const verified = verifyPaymentConnectState(state);
  if (
    !verified ||
    verified.provider !== "STRIPE" ||
    verified.tenantSiteId !== session.tenantSiteId ||
    verified.siteSlug !== session.tenantSlug ||
    verified.siteAdminUserId !== session.siteAdminUserId
  ) {
    return NextResponse.json({ ok: false, error: "INVALID_CONNECT_STATE" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ ok: false, error: "MISSING_STRIPE_CONNECT_CODE" }, { status: 400 });
  }
  return NextResponse.json({
    ok: false,
    error: "STRIPE_CONNECT_TOKEN_EXCHANGE_NOT_IMPLEMENTED",
    message: "Stripe returned an authorization code, but secure token exchange/storage is intentionally not enabled in this pass.",
  }, { status: 501 });
}
