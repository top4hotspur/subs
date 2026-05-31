import { NextResponse } from "next/server";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { isStripeCheckoutConfigured } from "@/lib/billing/stripe-checkout";

function hasEnv(name: string): boolean {
  const value = getOptionalServerEnv(name);
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const stripeSecretKey = getOptionalServerEnv("STRIPE_SECRET_KEY") ?? "";
  const stripeWebhookSecret = getOptionalServerEnv("STRIPE_WEBHOOK_SECRET") ?? "";
  const setupPriceValue = getOptionalServerEnv("STRIPE_PRICE_SETUP_FEE") ?? "";
  const monthlyPriceValue = getOptionalServerEnv("STRIPE_PRICE_MONTHLY_SUBSCRIPTION") ?? "";
  const domainPriceValue = getOptionalServerEnv("STRIPE_PRICE_DOMAIN_SERVICE") ?? "";

  const stripeSecretKeyPresent = hasEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecretPresent = hasEnv("STRIPE_WEBHOOK_SECRET");
  const setupPricePresent = hasEnv("STRIPE_PRICE_SETUP_FEE");
  const monthlyPricePresent = hasEnv("STRIPE_PRICE_MONTHLY_SUBSCRIPTION");
  const domainPricePresent = hasEnv("STRIPE_PRICE_DOMAIN_SERVICE");
  const nextPublicSiteUrlPresent = hasEnv("NEXT_PUBLIC_SITE_URL");
  const stripeConfigured = isStripeCheckoutConfigured();
  const setupPriceLooksLikeStripePriceId = setupPriceValue.startsWith("price_");
  const monthlyPriceLooksLikeStripePriceId = monthlyPriceValue.startsWith("price_");
  const domainPriceLooksLikeStripePriceId = domainPriceValue.startsWith("price_");
  const stripeSecretLooksLikeTestKey = stripeSecretKey.startsWith("sk_test_");
  const webhookSecretLooksLikeWebhookSecret = stripeWebhookSecret.startsWith("whsec_");
  const warnings: string[] = [];

  if (setupPricePresent && !setupPriceLooksLikeStripePriceId) {
    warnings.push("STRIPE_PRICE_SETUP_FEE must be a Stripe Price ID such as price_..., not an amount.");
  }
  if (monthlyPricePresent && !monthlyPriceLooksLikeStripePriceId) {
    warnings.push("STRIPE_PRICE_MONTHLY_SUBSCRIPTION must be a Stripe Price ID such as price_..., not an amount.");
  }
  if (domainPricePresent && !domainPriceLooksLikeStripePriceId) {
    warnings.push("STRIPE_PRICE_DOMAIN_SERVICE must be a Stripe Price ID such as price_..., not an amount.");
  }
  if (!domainPricePresent) {
    warnings.push("STRIPE_PRICE_DOMAIN_SERVICE is required for full checkout configuration.");
  }

  return NextResponse.json({
    ok: true,
    stripeSecretKeyPresent,
    stripeWebhookSecretPresent,
    setupPricePresent,
    monthlyPricePresent,
    domainPricePresent,
    nextPublicSiteUrlPresent,
    stripeConfigured,
    setupPriceLooksLikeStripePriceId,
    monthlyPriceLooksLikeStripePriceId,
    domainPriceLooksLikeStripePriceId,
    stripeSecretLooksLikeTestKey,
    webhookSecretLooksLikeWebhookSecret,
    warnings,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
