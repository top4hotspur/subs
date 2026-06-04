import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import {
  upsertPaymentProviderConnection,
  verifyPaymentConnectState,
} from "@/lib/sites/payment-provider-connections";
import {
  getStripeClientForTenantPayments,
  getStripeConnectConfig,
  getStripeTenantCheckoutConfig,
  stripeEnvironmentFromSecret,
} from "@/lib/billing/stripe-tenant-checkout";

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
  const config = getStripeConnectConfig();
  if (!config) {
    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "PENDING",
      publicEnabled: false,
      setupNotes: "Stripe Connect returned to the app, but platform Stripe Connect config is missing.",
    });
    return NextResponse.json({ ok: false, error: "STRIPE_CONNECT_NOT_CONFIGURED" }, { status: 501 });
  }

  try {
    const stripe = getStripeClientForTenantPayments(config);
    const oauth = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });
    const connectedAccountId = oauth.stripe_user_id;
    if (!connectedAccountId || !connectedAccountId.startsWith("acct_")) {
      throw new Error("STRIPE_CONNECTED_ACCOUNT_MISSING");
    }

    const account = await stripe.accounts.retrieve(connectedAccountId);
    const accountReady = Boolean(account.charges_enabled);
    const tenantWebhookConfigured = Boolean(getStripeTenantCheckoutConfig());
    const publicCheckoutReady = accountReady && tenantWebhookConfigured;
    const accountName =
      account.business_profile?.name ||
      (typeof account.company?.name === "string" ? account.company.name : null) ||
      null;
    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: "OAUTH_CONNECTED",
      connectionStatus: accountReady ? "CONNECTED" : "NEEDS_ATTENTION",
      environment: stripeEnvironmentFromSecret(config.secretKey),
      providerAccountId: connectedAccountId,
      providerAccountName: accountName,
      providerAccountEmail: account.email ?? null,
      publicEnabled: publicCheckoutReady,
      setupNotes: accountReady
        ? tenantWebhookConfigured
          ? "Stripe Connect account connected. Tenant booking checkout is ready for fixed-price services."
          : "Stripe Connect account connected, but tenant Stripe webhook config is missing so public checkout remains disabled."
        : "Stripe account connected, but Stripe reports charges are not enabled yet. Complete Stripe onboarding before checkout goes live.",
    });

    return NextResponse.redirect(
      new URL(`/site-admin/${encodeURIComponent(session.tenantSlug)}?paymentProvider=stripe&connect=${publicCheckoutReady ? "connected" : "needs_attention"}`, request.url),
    );
  } catch {
    await upsertPaymentProviderConnection({
      tenantSiteId: session.tenantSiteId,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "NEEDS_ATTENTION",
      publicEnabled: false,
      setupNotes: "Stripe Connect callback could not be completed. No access token was stored.",
    });
    return NextResponse.json({ ok: false, error: "STRIPE_CONNECT_CALLBACK_FAILED" }, { status: 400 });
  }
}
