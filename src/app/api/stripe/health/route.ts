import { NextResponse } from "next/server";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { isStripeCheckoutConfigured } from "@/lib/billing/stripe-checkout";

function hasEnv(name: string): boolean {
  const value = getOptionalServerEnv(name);
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const stripeSecretKeyPresent = hasEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecretPresent = hasEnv("STRIPE_WEBHOOK_SECRET");
  const setupPricePresent = hasEnv("STRIPE_PRICE_SETUP_FEE");
  const monthlyPricePresent = hasEnv("STRIPE_PRICE_MONTHLY_SUBSCRIPTION");
  const domainPricePresent = hasEnv("STRIPE_PRICE_DOMAIN_SERVICE");
  const nextPublicSiteUrlPresent = hasEnv("NEXT_PUBLIC_SITE_URL");
  const stripeConfigured = isStripeCheckoutConfigured();

  return NextResponse.json({
    ok: true,
    stripeSecretKeyPresent,
    stripeWebhookSecretPresent,
    setupPricePresent,
    monthlyPricePresent,
    domainPricePresent,
    nextPublicSiteUrlPresent,
    stripeConfigured,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
