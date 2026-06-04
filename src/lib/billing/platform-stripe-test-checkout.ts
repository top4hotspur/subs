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
  if (config.priceId) {
    const price = await stripe.prices.retrieve(config.priceId);
    return {
      priceId: price.id,
      productId: typeof price.product === "string" ? price.product : price.product?.id ?? config.productId,
      mode: checkoutModeForPrice(price),
      source: "PRICE_ENV",
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
    testPricePresent: Boolean(priceId),
    testPriceLooksLikeStripePriceId: looksLikeStripePriceId(priceId),
    configured: Boolean(looksLikeStripeSecret(secretKey) && (looksLikeStripePriceId(priceId) || looksLikeStripeProductId(productId))),
    warnings,
  };
}
