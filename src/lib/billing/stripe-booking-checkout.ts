/**
 * Deprecated compatibility stub.
 *
 * Subscriber booking checkout must use `stripe-tenant-checkout.ts`, which keeps tenant Stripe
 * Connect payments and tenant webhooks separate from MyExperiment.club platform subscriptions.
 */
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

export function getStripeBookingCheckoutConfig(): StripeBookingCheckoutConfig | null {
  return null;
}

export function isStripeBookingCheckoutConfigured(): boolean {
  return false;
}

export async function createStripeBookingCheckoutSession(): Promise<never> {
  throw new Error("DEPRECATED_USE_STRIPE_TENANT_CHECKOUT");
}
