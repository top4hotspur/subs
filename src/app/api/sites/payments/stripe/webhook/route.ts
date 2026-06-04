import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import {
  getCustomerSiteBookingById,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import {
  tenantBookingBusinessNotification,
  tenantBookingCustomerConfirmation,
} from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { createBookingAccessUrl } from "@/lib/sites/booking-access-token";
import {
  getStripeClientForTenantPayments,
  getStripeTenantCheckoutConfig,
} from "@/lib/billing/stripe-tenant-checkout";

async function sendBookingPaymentConfirmationEmails(
  bookingId: string,
  tenantSiteId: string,
  siteSlug: string,
) {
  const booking = await getCustomerSiteBookingById(tenantSiteId, bookingId);
  const site = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!booking || !site) return;

  const siteName =
    site.settings?.siteDisplayName ||
    site.settings?.businessName ||
    site.tenantSite.displayName ||
    "Your business";
  const siteSummary = {
    siteName,
    siteSlug: site.tenantSite.slug,
    contactEmail: site.settings?.email ?? null,
    contactPhone: site.settings?.phone ?? null,
    adminUrl: `/site-admin/${encodeURIComponent(site.tenantSite.slug)}`,
    bookingUrl: createBookingAccessUrl({
      baseUrl: getOptionalServerEnv("NEXT_PUBLIC_SITE_URL"),
      siteSlug: site.tenantSite.slug,
      tenantSiteId,
      bookingId,
    }),
  };

  if (booking.customerEmail) {
    await sendTransactionalEmail({
      to: booking.customerEmail,
      ...tenantBookingCustomerConfirmation(booking, siteSummary),
      replyTo: site.settings?.email ?? undefined,
    });
  }
  if (site.settings?.email) {
    await sendTransactionalEmail({
      to: site.settings.email,
      ...tenantBookingBusinessNotification(booking, siteSummary),
      replyTo: booking.customerEmail ?? undefined,
    });
  }
}

async function markCheckoutSessionPaid(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  const tenantSiteId = session.metadata?.tenantSiteId;
  const siteSlug = session.metadata?.siteSlug;
  if (!bookingId || !tenantSiteId || !siteSlug) return;

  const existing = await getCustomerSiteBookingById(tenantSiteId, bookingId);
  if (!existing) return;
  if (existing.tenantSiteId !== tenantSiteId) return;
  if (existing.paymentStatus === "PAID" || existing.paymentStatus === "PAYMENT_COMPLETED") return;

  await updateCustomerSiteBookingStatus(tenantSiteId, {
    bookingId,
    status: "CONFIRMED",
    paymentStatus: session.payment_status === "paid" ? "PAID" : "PENDING",
    paymentMethod: "CARD_ONLINE",
    paymentProvider: "STRIPE",
    paymentProviderSessionId: session.id,
    paymentProviderPaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : undefined,
  });

  if (session.payment_status === "paid") {
    await sendBookingPaymentConfirmationEmails(bookingId, tenantSiteId, siteSlug);
  }
}

async function markCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  const tenantSiteId = session.metadata?.tenantSiteId;
  if (!bookingId || !tenantSiteId) return;
  const existing = await getCustomerSiteBookingById(tenantSiteId, bookingId);
  if (!existing) return;
  if (existing.paymentStatus === "PAID" || existing.paymentStatus === "PAYMENT_COMPLETED") return;
  await updateCustomerSiteBookingStatus(tenantSiteId, {
    bookingId,
    status: "CANCELLED",
    paymentStatus: "FAILED",
    paymentMethod: "CARD_ONLINE",
    paymentProvider: "STRIPE",
    paymentProviderSessionId: session.id,
  });
}

async function markPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;
  const tenantSiteId = paymentIntent.metadata?.tenantSiteId;
  if (!bookingId || !tenantSiteId) return;
  const existing = await getCustomerSiteBookingById(tenantSiteId, bookingId);
  if (!existing) return;
  if (existing.paymentStatus === "PAID" || existing.paymentStatus === "PAYMENT_COMPLETED") return;
  await updateCustomerSiteBookingStatus(tenantSiteId, {
    bookingId,
    status: "CANCELLED",
    paymentStatus: "FAILED",
    paymentMethod: "CARD_ONLINE",
    paymentProvider: "STRIPE",
    paymentProviderPaymentIntentId: paymentIntent.id,
  });
}

export async function POST(request: NextRequest) {
  const config = getStripeTenantCheckoutConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "STRIPE_TENANT_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, error: "MISSING_STRIPE_SIGNATURE" }, { status: 400 });
    }

    const payload = await request.text();
    const stripe = getStripeClientForTenantPayments(config);
    const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.paymentPurpose === "TENANT_BOOKING") {
        await markCheckoutSessionPaid(session);
      }
      return NextResponse.json({ ok: true });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.paymentPurpose === "TENANT_BOOKING") {
        await markCheckoutSessionFailed(session);
      }
      return NextResponse.json({ ok: true });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.paymentPurpose === "TENANT_BOOKING") {
        await markPaymentIntentFailed(paymentIntent);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "TENANT_STRIPE_WEBHOOK_INVALID" }, { status: 400 });
  }
}
