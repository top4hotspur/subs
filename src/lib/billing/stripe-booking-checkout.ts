import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import { getSiteUrl } from "@/lib/billing/stripe-checkout";

export type StripeBookingCheckoutConfig = {
  secretKey: string;
  webhookSecret: string;
};

export type CreateStripeBookingCheckoutInput = {
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
};

function looksLikeStripeSecret(value: string | null | undefined): boolean {
  return Boolean(value && (value.startsWith("sk_test_") || value.startsWith("sk_live_")));
}

function looksLikeStripeWebhookSecret(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("whsec_"));
}

export function getStripeBookingCheckoutConfig(): StripeBookingCheckoutConfig | null {
  const secretKey = getOptionalServerEnv("STRIPE_SECRET_KEY");
  const webhookSecret = getOptionalServerEnv("STRIPE_WEBHOOK_SECRET");

  if (!looksLikeStripeSecret(secretKey) || !looksLikeStripeWebhookSecret(webhookSecret)) {
    return null;
  }

  return { secretKey: secretKey ?? "", webhookSecret: webhookSecret ?? "" };
}

export function isStripeBookingCheckoutConfigured(): boolean {
  return Boolean(getStripeBookingCheckoutConfig());
}

export async function createStripeBookingCheckoutSession(
  input: CreateStripeBookingCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const config = getStripeBookingCheckoutConfig();
  if (!config) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!Number.isInteger(input.amountPence) || input.amountPence <= 0) {
    throw new Error("BOOKING_PAYMENT_AMOUNT_REQUIRED");
  }

  const stripe = new Stripe(config.secretKey);
  const baseUrl = getSiteUrl(input.origin);
  const successUrl = `${baseUrl}/sites/${encodeURIComponent(input.siteSlug)}/booking/payment?bookingId=${encodeURIComponent(input.bookingId)}&checkout=success`;
  const cancelUrl = `${baseUrl}/sites/${encodeURIComponent(input.siteSlug)}/booking/payment?bookingId=${encodeURIComponent(input.bookingId)}&checkout=cancelled`;
  const metadata = {
    paymentPurpose: "SUBSCRIBER_BOOKING",
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
