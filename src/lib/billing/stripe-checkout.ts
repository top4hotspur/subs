import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export type StripeCheckoutConfig = {
  secretKey: string;
  monthlyPriceId: string;
  setupPriceId: string;
  domainServicePriceId: string;
  webhookSecret: string;
};

export function getStripeCheckoutConfig(): StripeCheckoutConfig | null {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY");
  const monthlyPriceId = getOptionalServerEnv("STRIPE_PRICE_MONTHLY_SUBSCRIPTION");
  const setupPriceId = getOptionalServerEnv("STRIPE_PRICE_SETUP_FEE");
  const domainServicePriceId = getOptionalServerEnv("STRIPE_PRICE_DOMAIN_SERVICE");
  const webhookSecret = getOptionalServerEnv("STRIPE_WEBHOOK_SECRET");

  if (!secretKey || !monthlyPriceId || !setupPriceId || !domainServicePriceId || !webhookSecret) {
    return null;
  }

  return {
    secretKey,
    monthlyPriceId,
    setupPriceId,
    domainServicePriceId,
    webhookSecret,
  };
}

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(getStripeCheckoutConfig());
}

export function getStripeClient(config?: StripeCheckoutConfig): Stripe {
  const resolved = config ?? getStripeCheckoutConfig();
  if (!resolved) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  return new Stripe(resolved.secretKey);
}

export function getSiteUrl(fallbackOrigin: string): string {
  const fromEnv = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL");
  return (fromEnv ?? fallbackOrigin).replace(/\/+$/, "");
}
