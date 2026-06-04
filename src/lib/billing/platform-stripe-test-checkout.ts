import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export type PlatformStripeTestCheckoutConfig = {
  secretKey: string;
  productId: string | null;
  priceId: string | null;
};

export type PlatformStripeTestPriceSelection = {
  priceId: string;
  productId: string | null;
  mode: "payment" | "subscription";
  source: "PRICE_ENV" | "PRODUCT_DEFAULT_PRICE" | "PRODUCT_ACTIVE_PRICE";
  active: boolean;
  currency: string | null;
  unitAmount: number | null;
  warnings: string[];
};

function looksLikeStripeSecret(value: string | null | undefined): boolean {
  return Boolean(value && (value.startsWith("sk_test_") || value.startsWith("sk_live_")));
}

function looksLikeStripePriceId(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("price_"));
}

function looksLikeStripeProductId(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("prod_"));
}

function maskStripeId(value: string): string | null {
  if (!value) return null;
  if (value.length <= 10) return `${value.slice(0, 4)}...`;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function getPlatformStripeTestCheckoutConfig(): PlatformStripeTestCheckoutConfig | null {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY");
  if (!looksLikeStripeSecret(secretKey)) return null;
  const productId = getOptionalServerEnv("STRIPE_PLATFORM_TEST_PRODUCT_ID") ?? null;
  const priceId = getOptionalServerEnv("STRIPE_PLATFORM_TEST_PRICE_ID") ?? null;
  return {
    secretKey: secretKey ?? "",
    productId: looksLikeStripeProductId(productId) ? productId : null,
    priceId: looksLikeStripePriceId(priceId) ? priceId : null,
  };
}

export function getPlatformStripeTestClient(config?: PlatformStripeTestCheckoutConfig): Stripe {
  const resolved = config ?? getPlatformStripeTestCheckoutConfig();
  if (!resolved) throw new Error("STRIPE_PLATFORM_TEST_NOT_CONFIGURED");
  return new Stripe(resolved.secretKey);
}

function checkoutModeForPrice(price: Stripe.Price): "payment" | "subscription" {
  return price.recurring ? "subscription" : "payment";
}

export async function resolvePlatformStripeTestPrice(
  stripe: Stripe,
  config: PlatformStripeTestCheckoutConfig,
): Promise<PlatformStripeTestPriceSelection> {
  const warnings: string[] = [];
  if (config.priceId) {
    const price = await stripe.prices.retrieve(config.priceId);
    const priceProductId = typeof price.product === "string" ? price.product : price.product?.id ?? null;
    if (!price.active) {
      throw new Error("STRIPE_PLATFORM_TEST_PRICE_INACTIVE");
    }
    if (config.productId && priceProductId && config.productId !== priceProductId) {
      warnings.push("STRIPE_PLATFORM_TEST_PRODUCT_ID does not match the configured price product. The price is being used.");
    }
    return {
      priceId: price.id,
      productId: priceProductId ?? config.productId,
      mode: checkoutModeForPrice(price),
      source: "PRICE_ENV",
      active: price.active,
      currency: price.currency ?? null,
      unitAmount: price.unit_amount ?? null,
      warnings,
    };
  }

  if (!config.productId) {
    throw new Error("STRIPE_PLATFORM_TEST_PRICE_REQUIRED");
  }

  const product = await stripe.products.retrieve(config.productId);
  const defaultPriceId =
    typeof product.default_price === "string"
      ? product.default_price
      : product.default_price?.id;
  if (defaultPriceId?.startsWith("price_")) {
    const price = await stripe.prices.retrieve(defaultPriceId);
    if (price.active) {
      return {
        priceId: price.id,
        productId: product.id,
        mode: checkoutModeForPrice(price),
        source: "PRODUCT_DEFAULT_PRICE",
        active: price.active,
        currency: price.currency ?? null,
        unitAmount: price.unit_amount ?? null,
        warnings,
      };
    }
  }

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 10,
  });
  const price = prices.data[0] ?? null;
  if (!price) {
    throw new Error("STRIPE_PLATFORM_TEST_PRICE_REQUIRED");
  }
  return {
    priceId: price.id,
    productId: product.id,
    mode: checkoutModeForPrice(price),
    source: "PRODUCT_ACTIVE_PRICE",
    active: price.active,
    currency: price.currency ?? null,
    unitAmount: price.unit_amount ?? null,
    warnings,
  };
}

export function platformStripeTestConfigHealth() {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY") ?? "";
  const productId = getOptionalServerEnv("STRIPE_PLATFORM_TEST_PRODUCT_ID") ?? "";
  const priceId = getOptionalServerEnv("STRIPE_PLATFORM_TEST_PRICE_ID") ?? "";
  const warnings: string[] = [];
  if (priceId && !looksLikeStripePriceId(priceId)) {
    warnings.push("STRIPE_PLATFORM_TEST_PRICE_ID must be a Stripe Price ID such as price_..., not a Product ID or amount.");
  }
  if (productId && !looksLikeStripeProductId(productId)) {
    warnings.push("STRIPE_PLATFORM_TEST_PRODUCT_ID must be a Stripe Product ID such as prod_....");
  }
  if (!priceId && !productId) {
    warnings.push("Set STRIPE_PLATFORM_TEST_PRICE_ID, or set STRIPE_PLATFORM_TEST_PRODUCT_ID so the app can look up an active price.");
  }
  return {
    stripeSecretKeyPresent: Boolean(secretKey),
    stripeSecretLooksLikeStripeSecret: looksLikeStripeSecret(secretKey),
    testProductPresent: Boolean(productId),
    testProductLooksLikeStripeProductId: looksLikeStripeProductId(productId),
    testProductMasked: maskStripeId(productId),
    testPricePresent: Boolean(priceId),
    testPriceLooksLikeStripePriceId: looksLikeStripePriceId(priceId),
    testPriceMasked: maskStripeId(priceId),
    configured: Boolean(looksLikeStripeSecret(secretKey) && (looksLikeStripePriceId(priceId) || looksLikeStripeProductId(productId))),
    expectedEnvKeys: [
      "STRIPE_SECRET_KEY",
      "STRIPE_PLATFORM_TEST_PRICE_ID",
      "STRIPE_PLATFORM_TEST_PRODUCT_ID",
    ],
    checkedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? null,
    warnings,
  };
}
