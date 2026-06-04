import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import {
  getStripeTenantCheckoutConfig,
  retrieveStripeV2ConnectedAccount,
} from "@/lib/billing/stripe-tenant-checkout";
import {
  getPaymentProviderConnection,
  upsertPaymentProviderConnection,
} from "@/lib/sites/payment-provider-connections";

export async function GET(request: Request) {
  const session = await getSiteAdminSessionContext();
  if (!session) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const url = new URL(request.url);
  const returnedAccountId = url.searchParams.get("account") ?? "";
  const existing = await getPaymentProviderConnection(session.tenantSiteId, "STRIPE");
  const connectedAccountId = existing?.providerAccountId ?? returnedAccountId;

  if (!connectedAccountId.startsWith("acct_")) {
    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "NEEDS_ATTENTION",
      publicEnabled: false,
      setupNotes: "Stripe returned to the app, but no connected account ID was available.",
    });
    return NextResponse.json({ ok: false, error: "STRIPE_CONNECTED_ACCOUNT_MISSING" }, { status: 400 });
  }

  if (returnedAccountId && existing?.providerAccountId && returnedAccountId !== existing.providerAccountId) {
    return NextResponse.json({ ok: false, error: "STRIPE_CONNECTED_ACCOUNT_MISMATCH" }, { status: 400 });
  }

  try {
    const account = await retrieveStripeV2ConnectedAccount(connectedAccountId);
    const tenantWebhookConfigured = Boolean(getStripeTenantCheckoutConfig());
    const publicCheckoutReady = account.chargesEnabled && tenantWebhookConfigured;

    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: account.chargesEnabled ? "OAUTH_CONNECTED" : "OAUTH_PENDING",
      connectionStatus: account.chargesEnabled ? "CONNECTED" : "NEEDS_ATTENTION",
      environment: account.environment,
      providerAccountId: connectedAccountId,
      providerAccountName: account.displayName,
      providerAccountEmail: account.email,
      publicEnabled: publicCheckoutReady,
      setupNotes: account.chargesEnabled
        ? tenantWebhookConfigured
          ? "Stripe Account Links onboarding is complete. Tenant booking checkout is ready for fixed-price services."
          : "Stripe Account Links onboarding is complete, but tenant Stripe webhook config is missing so public checkout remains disabled."
        : account.requirementsSummary,
    });

    return NextResponse.redirect(
      new URL(
        `/site-admin/${encodeURIComponent(session.tenantSlug)}?paymentProvider=stripe&connect=${publicCheckoutReady ? "connected" : "needs_attention"}`,
        request.url,
      ),
    );
  } catch {
    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "NEEDS_ATTENTION",
      publicEnabled: false,
      setupNotes: "Stripe Account Links return could not be verified. No OAuth access token or secret was stored.",
    });
    return NextResponse.json({ ok: false, error: "STRIPE_ACCOUNT_LINK_RETURN_FAILED" }, { status: 400 });
  }
}
