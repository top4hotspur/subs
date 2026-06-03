import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createPaymentConnectState,
  getStripeConnectClientId,
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

  const clientId = getStripeConnectClientId();
  if (!clientId) {
    await upsertPaymentProviderConnection({
      tenantSiteId: site.id,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "PENDING",
      publicEnabled: false,
      setupNotes: "Stripe Connect app credentials are not configured yet.",
    });
    return NextResponse.json({
      ok: false,
      error: "STRIPE_CONNECT_NOT_CONFIGURED",
      message: "Stripe Connect is not configured yet. No account was connected.",
    }, { status: 501 });
  }

  const state = createPaymentConnectState({
    tenantSiteId: site.id,
    siteSlug: site.slug,
    siteAdminUserId: session.siteAdminUserId,
    provider: "STRIPE",
  });
  await upsertPaymentProviderConnection({
    tenantSiteId: site.id,
    provider: "STRIPE",
    connectionMode: "OAUTH_PENDING",
    connectionStatus: "PENDING",
    publicEnabled: false,
  });
  const redirectUrl = new URL("https://connect.stripe.com/oauth/authorize");
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("client_id", clientId);
  redirectUrl.searchParams.set("scope", "read_write");
  redirectUrl.searchParams.set("state", state);

  return NextResponse.json({
    ok: true,
    redirectUrl: redirectUrl.toString(),
    message: "Stripe Connect authorization can start. Callback token exchange is not enabled in this pass.",
  });
}
