import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { getSiteUrl } from "@/lib/billing/stripe-checkout";
import type { PaymentProviderConnectionRecord } from "@/lib/sites/payment-provider-connections";

export type StripeTenantCheckoutConfig = {
  secretKey: string;
  webhookSecret: string;
};

export type StripeConnectConfig = {
  secretKey: string;
  clientId: string;
};

export type CreateStripeTenantBookingCheckoutInput = {
  siteSlug: string;
  tenantSiteId: string;
  bookingId: string;
  serviceId: string;
  serviceName: string;
  staffId?: string | null;
  customerEmail: string;
  customerName: string;
  amountPence: number;
  currency: string;
  origin: string;
  connectedAccountId: string;
};

function looksLikeStripeSecret(value: string | null | undefined): boolean {
  return Boolean(value && (value.startsWith("sk_test_") || value.startsWith("sk_live_")));
}

function looksLikeStripeWebhookSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("whsec_"));
}

export function stripeEnvironmentFromSecret(secretKey: string): "TEST" | "LIVE" {
  return secretKey.startsWith("sk_live_") ? "LIVE" : "TEST";
}

export function getStripeConnectConfig(): StripeConnectConfig | null {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY");
  const clientId = getOptionalServerEnv("STRIPE_CONNECT_CLIENT_ID");
  if (!looksLikeStripeSecret(secretKey) || !clientId) return null;
  return { secretKey: secretKey ?? "", clientId };
}

export function getStripeTenantCheckoutConfig(): StripeTenantCheckoutConfig | null {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY");
  const webhookSecret = getOptionalServerEnv("STRIPE_TENANT_WEBHOOK_SECRET");
  if (!looksLikeStripeSecret(secretKey) || !looksLikeStripeWebhookSecret(webhookSecret)) return null;
  return { secretKey: secretKey ?? "", webhookSecret: webhookSecret ?? "" };
}

export function isStripeTenantCheckoutConfigured(): boolean {
  return Boolean(getStripeTenantCheckoutConfig());
}

export function getStripeClientForTenantPayments(config?: StripeTenantCheckoutConfig | StripeConnectConfig): Stripe {
  const resolved = config ?? getStripeTenantCheckoutConfig() ?? getStripeConnectConfig();
  if (!resolved) throw new Error("STRIPE_TENANT_PAYMENTS_NOT_CONFIGURED");
  return new Stripe(resolved.secretKey);
}

export function isStripeConnectionCheckoutReady(
  connection?: Pick<PaymentProviderConnectionRecord, "connectionStatus" | "connectionMode" | "publicEnabled" | "providerAccountId"> & { provider?: string | null } | null,
): boolean {
  return Boolean(
    connection?.provider === "STRIPE" &&
      connection.publicEnabled &&
      connection.connectionStatus === "CONNECTED" &&
      connection.connectionMode === "OAUTH_CONNECTED" &&
      connection.providerAccountId &&
      isStripeTenantCheckoutConfigured(),
  );
}

export async function createStripeTenantBookingCheckoutSession(
  input: CreateStripeTenantBookingCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const config = getStripeTenantCheckoutConfig();
  if (!config) throw new Error("STRIPE_TENANT_CHECKOUT_NOT_CONFIGURED");
  if (!input.connectedAccountId.startsWith("acct_")) throw new Error("STRIPE_CONNECTED_ACCOUNT_REQUIRED");
  if (!Number.isInteger(input.amountPence) || input.amountPence <= 0) {
    throw new Error("BOOKING_PAYMENT_AMOUNT_REQUIRED");
  }

  const stripe = getStripeClientForTenantPayments(config);
  const baseUrl = getSiteUrl(input.origin);
  const successUrl = `${baseUrl}/sites/${encodeURIComponent(input.siteSlug)}/booking/payment?bookingId=${encodeURIComponent(input.bookingId)}&checkout=success`;
  const cancelUrl = `${baseUrl}/sites/${encodeURIComponent(input.siteSlug)}/booking/payment?bookingId=${encodeURIComponent(input.bookingId)}&checkout=cancelled`;
  const metadata = {
    paymentPurpose: "TENANT_BOOKING",
    tenantSiteId: input.tenantSiteId,
    siteSlug: input.siteSlug,
    bookingId: input.bookingId,
    serviceId: input.serviceId,
    staffId: input.staffId ?? "",
    customerEmail: input.customerEmail,
  };

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    client_reference_id: input.bookingId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: {
      metadata,
      transfer_data: {
        destination: input.connectedAccountId,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountPence,
          product_data: {
            name: input.serviceName,
            description: `Booking for ${input.customerName}`,
          },
        },
      },
    ],
  });
}
