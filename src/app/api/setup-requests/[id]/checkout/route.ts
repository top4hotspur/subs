import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { DomainOption } from "@/lib/sites/types";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { getSetupRequestById, getSetupRequestByIdForConfirmation, markSetupRequestCheckoutStarted } from "@/lib/setup/setup-request-repository";
import { getStripeCheckoutConfig, getStripeClient, getSiteUrl } from "@/lib/billing/stripe-checkout";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  const stripeConfig = getStripeCheckoutConfig();
  if (!stripeConfig) {
    return NextResponse.json({ ok: false, error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const isAdmin = await isPlatformAdminSession();
    const setupRequest = isAdmin
      ? await getSetupRequestById(id)
      : await getSetupRequestByIdForConfirmation(id, token);

    if (!setupRequest) {
      return NextResponse.json({ ok: false, error: "SETUP_REQUEST_NOT_FOUND" }, { status: 404 });
    }

    const stripe = getStripeClient(stripeConfig);
    const siteUrl = getSiteUrl(request.nextUrl.origin);
    const successUrl = `${siteUrl}/setup/confirmation?requestId=${encodeURIComponent(
      setupRequest.id,
    )}&source=backend${token ? `&token=${encodeURIComponent(token)}` : ""}&payment=success`;
    const cancelUrl = `${siteUrl}/setup/confirmation?requestId=${encodeURIComponent(
      setupRequest.id,
    )}&source=backend${token ? `&token=${encodeURIComponent(token)}` : ""}&payment=cancelled`;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: stripeConfig.setupPriceId, quantity: 1 },
      { price: stripeConfig.monthlyPriceId, quantity: 1 },
    ];

    if (setupRequest.domainOption === DomainOption.WE_REGISTER_DOMAIN) {
      lineItems.push({ price: stripeConfig.domainServicePriceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: setupRequest.contactEmail ?? undefined,
      client_reference_id: setupRequest.id,
      metadata: {
        setupRequestId: setupRequest.id,
        industrySlug: setupRequest.industrySlug,
        domainOption: setupRequest.domainOption,
      },
      subscription_data: {
        metadata: {
          setupRequestId: setupRequest.id,
          industrySlug: setupRequest.industrySlug,
        },
      },
    });

    await markSetupRequestCheckoutStarted(setupRequest.id, {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      paymentStatus: "CHECKOUT_STARTED",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SETUP_CHECKOUT_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
