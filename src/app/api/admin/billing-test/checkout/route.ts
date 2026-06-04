import { NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { getSiteUrl } from "@/lib/billing/stripe-checkout";
import {
  getPlatformStripeTestCheckoutConfig,
  getPlatformStripeTestClient,
  platformStripeTestConfigHealth,
  resolvePlatformStripeTestPrice,
} from "@/lib/billing/platform-stripe-test-checkout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toCheckoutError(error: unknown) {
  if (error instanceof Error && error.message === "STRIPE_PLATFORM_TEST_PRICE_REQUIRED") {
    return NextResponse.json({
      ok: false,
      error: "STRIPE_PLATFORM_TEST_PRICE_REQUIRED",
      message: "Stripe Price ID is required for this test checkout. Open the Stripe product and copy the price_... value into STRIPE_PLATFORM_TEST_PRICE_ID.",
    }, { status: 400 });
  }
  if (error instanceof Error && error.message === "STRIPE_PLATFORM_TEST_PRICE_INACTIVE") {
    return NextResponse.json({
      ok: false,
      error: "STRIPE_PLATFORM_TEST_PRICE_INACTIVE",
      message: "The configured STRIPE_PLATFORM_TEST_PRICE_ID exists but is inactive. Use an active price_... value from the platform Stripe account.",
    }, { status: 400 });
  }
  return NextResponse.json({
    ok: false,
    error: "PLATFORM_STRIPE_TEST_CHECKOUT_FAILED",
    message: error instanceof Error ? error.message : "Unknown error",
  }, { status: 500 });
}

export async function GET() {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  return NextResponse.json(
    { ok: true, health: platformStripeTestConfigHealth() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const config = getPlatformStripeTestCheckoutConfig();
  if (!config) {
    return NextResponse.json({
      ok: false,
      error: "STRIPE_PLATFORM_TEST_NOT_CONFIGURED",
      message: "Platform Stripe test checkout needs STRIPE_SECRET_KEY and STRIPE_PLATFORM_TEST_PRICE_ID or STRIPE_PLATFORM_TEST_PRODUCT_ID.",
      health: platformStripeTestConfigHealth(),
    }, { status: 503 });
  }

  try {
    const stripe = getPlatformStripeTestClient(config);
    const price = await resolvePlatformStripeTestPrice(stripe, config);
    const siteUrl = getSiteUrl(new URL(request.url).origin);
    const successUrl = `${siteUrl}/admin/billing-test?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/admin/billing-test?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: price.mode,
      line_items: [{ price: price.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentPurpose: "PLATFORM_BILLING_TEST",
        productId: price.productId ?? "",
        priceId: price.priceId,
        priceSource: price.source,
      },
      ...(price.mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                paymentPurpose: "PLATFORM_BILLING_TEST",
                productId: price.productId ?? "",
                priceId: price.priceId,
              },
            },
          }
        : {}),
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      mode: price.mode,
      priceId: price.priceId,
      productId: price.productId,
      priceSource: price.source,
      priceActive: price.active,
      priceCurrency: price.currency,
      priceUnitAmount: price.unitAmount,
      warnings: price.warnings,
    });
  } catch (error) {
    return toCheckoutError(error);
  }
}
