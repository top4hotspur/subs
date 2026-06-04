import { NextResponse } from "next/server";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getSiteUrl } from "@/lib/billing/stripe-checkout";
import {
  createStripeV2AccountLink,
  createStripeV2ConnectedAccount,
  getStripeTenantCheckoutConfig,
  isStripeAccountLinksConfigured,
  retrieveStripeV2ConnectedAccount,
  type StripeConnectedAccountSummary,
} from "@/lib/billing/stripe-tenant-checkout";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getPaymentProviderConnection,
  upsertPaymentProviderConnection,
} from "@/lib/sites/payment-provider-connections";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

function safeStripeErrorDetails(error: unknown) {
  const stripeCode =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : null;
  const stripeMessage = error instanceof Error ? error.message : "";
  return {
    stripeCode,
    message: stripeMessage || null,
  };
}

function stripeErrorResponse(errorCode: string, message: string, status: number, error?: unknown) {
  return NextResponse.json({
    ok: false,
    error: errorCode,
    message,
    details: error ? safeStripeErrorDetails(error) : undefined,
  }, { status });
}

function stripeAccountCreateErrorResponse(error: unknown) {
  const { stripeCode, message: stripeMessage } = safeStripeErrorDetails(error);
  const responsibilityFieldError =
    stripeCode === "invalid_fields" ||
    (stripeMessage ?? "").includes("defaults.responsibilities.losses_collector") ||
    (stripeMessage ?? "").includes("defaults.responsibilities.fees_collector");

  if (responsibilityFieldError) {
    return stripeErrorResponse(
      "STRIPE_ACCOUNT_RESPONSIBILITIES_INVALID",
      "Stripe connected account could not be created. Stripe says required account responsibility fields are missing or invalid. Please check platform Connect setup.",
      400,
      error,
    );
  }

  return stripeErrorResponse(
    "STRIPE_ACCOUNT_CREATE_FAILED",
    "Stripe could not create a connected account. Please try again or check Stripe Connect setup.",
    400,
    error,
  );
}

async function createStripeOnboardingLink(request: Request, siteSlug: string) {
  if (!isBackendPersistenceConfigured()) return { response: backendNotConfigured() };
  const session = await getSiteAdminSessionContext();
  if (!session) return { response: NextResponse.json({ ok: false, error: "UNAUTHORISED" }, { status: 403 }) };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { response: NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 }) };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { response: NextResponse.json({ ok: false, error: "UNAUTHORISED" }, { status: 403 }) };
  }

  if (!isStripeAccountLinksConfigured()) {
    await upsertPaymentProviderConnection({
      tenantSiteId: site.id,
      provider: "STRIPE",
      connectionMode: "OAUTH_PENDING",
      connectionStatus: "PENDING",
      publicEnabled: false,
      setupNotes: "Stripe Account Links onboarding needs STRIPE_SECRET_KEY. STRIPE_CONNECT_CLIENT_ID is not used for this integration.",
    });
    return {
      response: NextResponse.json({
        ok: false,
        error: "STRIPE_SECRET_KEY_MISSING",
        message: "Stripe Account Links onboarding is not configured yet. Add a valid platform STRIPE_SECRET_KEY.",
      }, { status: 501 }),
    };
  }

  const existing = await getPaymentProviderConnection(site.id, "STRIPE");
  let connectedAccountId = existing?.providerAccountId?.startsWith("acct_") ? existing.providerAccountId : null;
  let accountSummary: StripeConnectedAccountSummary | null = null;
  if (connectedAccountId) {
    try {
      accountSummary = await retrieveStripeV2ConnectedAccount(connectedAccountId);
    } catch {
      connectedAccountId = null;
    }
  }
  if (!accountSummary) {
    try {
      accountSummary = await createStripeV2ConnectedAccount({
        siteSlug: site.slug,
        tenantSiteId: site.id,
        businessName: site.displayName,
        contactEmail: null,
      });
    } catch (error) {
      return { response: stripeAccountCreateErrorResponse(error) };
    }
    connectedAccountId = accountSummary.id;
  }
  const accountId = connectedAccountId ?? accountSummary.id;

  const tenantWebhookConfigured = Boolean(getStripeTenantCheckoutConfig());
  await upsertPaymentProviderConnection({
    tenantSiteId: site.id,
    provider: "STRIPE",
    connectionMode: accountSummary.chargesEnabled ? "OAUTH_CONNECTED" : "OAUTH_PENDING",
    connectionStatus: accountSummary.chargesEnabled ? "CONNECTED" : "PENDING",
    environment: accountSummary.environment,
    providerAccountId: accountId,
    providerAccountName: accountSummary.displayName,
    providerAccountEmail: accountSummary.email,
    publicEnabled: accountSummary.chargesEnabled && tenantWebhookConfigured,
    setupNotes: accountSummary.chargesEnabled
      ? tenantWebhookConfigured
        ? "Stripe Account Links onboarding is complete. Tenant booking checkout is ready for fixed-price services."
        : "Stripe Account Links onboarding is complete, but tenant Stripe webhook config is missing so public checkout remains disabled."
      : accountSummary.requirementsSummary,
  });

  const baseUrl = getSiteUrl(new URL(request.url).origin);
  const refreshUrl = `${baseUrl}/api/site-admin/${encodeURIComponent(site.slug)}/payments/stripe/connect/start`;
  const returnUrl = `${baseUrl}/api/site-admin/${encodeURIComponent(site.slug)}/payments/stripe/connect/callback?account=${encodeURIComponent(accountId)}`;
  let accountLink;
  try {
    accountLink = await createStripeV2AccountLink({
      connectedAccountId: accountId,
      refreshUrl,
      returnUrl,
    });
  } catch (error) {
    return {
      response: stripeErrorResponse(
        "STRIPE_ACCOUNT_LINK_CREATE_FAILED",
        "Stripe could not create an onboarding link. Please try again or check Stripe setup.",
        400,
        error,
      ),
    };
  }

  if (!accountLink.url) {
    return {
      response: stripeErrorResponse(
        "STRIPE_ACCOUNT_LINK_URL_MISSING",
        "Stripe created an Account Link response without an onboarding URL.",
        502,
      ),
    };
  }

  return {
    redirectUrl: accountLink.url,
    expiresAt: accountLink.expiresAt,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await context.params;
  try {
    const result = await createStripeOnboardingLink(request, siteSlug);
    if ("response" in result) return result.response;
    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    return stripeErrorResponse(
      "STRIPE_ACCOUNT_LINK_CREATE_FAILED",
      "Stripe could not create an onboarding link. Please try again or check Stripe setup.",
      400,
      error,
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await context.params;
  try {
    const result = await createStripeOnboardingLink(request, siteSlug);
    if ("response" in result) return result.response;
    return NextResponse.json({
      ok: true,
      redirectUrl: result.redirectUrl,
      expiresAt: result.expiresAt,
      message: "Stripe Account Links onboarding can start.",
    });
  } catch (error) {
    return stripeErrorResponse(
      "STRIPE_ACCOUNT_LINK_CREATE_FAILED",
      "Stripe could not create an onboarding link. Please try again or check Stripe setup.",
      400,
      error,
    );
  }
}
