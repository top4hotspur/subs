import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createPaymentConnectState,
  getSquareOAuthConfig,
  upsertPaymentProviderConnection,
} from "@/lib/sites/payment-provider-connections";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  const { siteSlug } = await context.params;
  const session = await getSiteAdminSessionContext();
  if (!session) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const square = getSquareOAuthConfig();
  if (!square.applicationId || !square.redirectUrl) {
    await upsertPaymentProviderConnection({
      tenantSiteId: site.id,
      provider: "SQUARE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "PENDING",
      publicEnabled: false,
      setupNotes: "Square OAuth app credentials are not configured yet.",
    });
    return NextResponse.json({
      ok: false,
      error: "SQUARE_OAUTH_NOT_CONFIGURED",
      message: "Square OAuth is not configured yet. No account was connected.",
    }, { status: 501 });
  }

  const state = createPaymentConnectState({
    tenantSiteId: site.id,
    siteSlug: site.slug,
    siteAdminUserId: session.siteAdminUserId,
    provider: "SQUARE",
  });
  await upsertPaymentProviderConnection({
    tenantSiteId: site.id,
    provider: "SQUARE",
    connectionMode: "OAUTH_PENDING",
    connectionStatus: "PENDING",
    publicEnabled: false,
  });
  const redirectUrl = new URL("https://connect.squareup.com/oauth2/authorize");
  redirectUrl.searchParams.set("client_id", square.applicationId);
  redirectUrl.searchParams.set("scope", "MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ");
  redirectUrl.searchParams.set("session", "false");
  redirectUrl.searchParams.set("state", state);
  redirectUrl.searchParams.set("redirect_uri", square.redirectUrl);

  return NextResponse.json({
    ok: true,
    redirectUrl: redirectUrl.toString(),
    message: "Square OAuth authorization can start. Callback token exchange is not enabled in this pass.",
  });
}
