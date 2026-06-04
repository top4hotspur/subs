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
};

export type StripeConnectedAccountSummary = {
  id: string;
  environment: "TEST" | "LIVE";
  displayName: string | null;
  email: string | null;
  chargesEnabled: boolean;
  requirementsDueCount: number;
  requirementsSummary: string;
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
  if (!looksLikeStripeSecret(secretKey)) return null;
  return { secretKey: secretKey ?? "" };
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

export function isStripeAccountLinksConfigured(): boolean {
  return Boolean(getStripeConnectConfig());
}

function summarizeV2Account(account: Stripe.V2.Core.Account): StripeConnectedAccountSummary {
  const merchantCardStatus = account.configuration?.merchant?.capabilities?.card_payments?.status ?? null;
  const transferStatus = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ?? null;
  const payoutStatus = account.configuration?.recipient?.capabilities?.stripe_balance?.payouts?.status ?? null;
  const userRequirements = account.requirements?.entries?.filter((entry) => entry.awaiting_action_from === "user") ?? [];
  const chargesEnabled = merchantCardStatus === "active" && (transferStatus === "active" || payoutStatus === "active");
  const requirementsSummary =
    userRequirements.length > 0
      ? `${userRequirements.length} Stripe onboarding requirement${userRequirements.length === 1 ? "" : "s"} still need attention.`
      : chargesEnabled
        ? "Stripe reports card payments and transfers are active."
        : "Stripe onboarding is in progress; payment capability is not active yet.";

  return {
    id: account.id,
    environment: account.livemode ? "LIVE" : "TEST",
    displayName: account.display_name ?? account.identity?.business_details?.registered_name ?? null,
    email: account.contact_email ?? null,
    chargesEnabled,
    requirementsDueCount: userRequirements.length,
    requirementsSummary,
  };
}

export async function createStripeV2ConnectedAccount(input: {
  siteSlug: string;
  tenantSiteId: string;
  businessName: string;
  contactEmail?: string | null;
}): Promise<StripeConnectedAccountSummary> {
  const config = getStripeConnectConfig();
  if (!config) throw new Error("STRIPE_ACCOUNT_LINKS_NOT_CONFIGURED");
  const stripe = getStripeClientForTenantPayments(config);
  const account = await stripe.v2.core.accounts.create({
    contact_email: input.contactEmail ?? undefined,
    dashboard: "express",
    display_name: input.businessName,
    defaults: {
      currency: "gbp",
    },
    identity: {
      country: "GB",
      business_details: {
        registered_name: input.businessName,
      },
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    metadata: {
      tenantSiteId: input.tenantSiteId,
      siteSlug: input.siteSlug,
      source: "myexperiment_subscriber_site",
    },
    include: ["configuration.merchant", "configuration.recipient", "identity", "requirements"],
  });
  return summarizeV2Account(account);
}

export async function retrieveStripeV2ConnectedAccount(accountId: string): Promise<StripeConnectedAccountSummary> {
  const config = getStripeConnectConfig();
  if (!config) throw new Error("STRIPE_ACCOUNT_LINKS_NOT_CONFIGURED");
  if (!accountId.startsWith("acct_")) throw new Error("STRIPE_CONNECTED_ACCOUNT_REQUIRED");
  const stripe = getStripeClientForTenantPayments(config);
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.merchant", "configuration.recipient", "identity", "requirements"],
  });
  return summarizeV2Account(account);
}

export async function createStripeV2AccountLink(input: {
  connectedAccountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<{ url: string; expiresAt: string }> {
  const config = getStripeConnectConfig();
  if (!config) throw new Error("STRIPE_ACCOUNT_LINKS_NOT_CONFIGURED");
  if (!input.connectedAccountId.startsWith("acct_")) throw new Error("STRIPE_CONNECTED_ACCOUNT_REQUIRED");
  const stripe = getStripeClientForTenantPayments(config);
  const accountLink = await stripe.v2.core.accountLinks.create({
    account: input.connectedAccountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant", "recipient"],
        refresh_url: input.refreshUrl,
        return_url: input.returnUrl,
        collection_options: {
          fields: "eventually_due",
          future_requirements: "include",
        },
      },
    },
  });
  return { url: accountLink.url, expiresAt: accountLink.expires_at };
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
    connectedAccountId: input.connectedAccountId,
  };

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    client_reference_id: input.bookingId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata },
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
  }, { stripeAccount: input.connectedAccountId });
}
