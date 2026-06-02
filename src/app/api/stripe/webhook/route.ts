import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripeCheckoutConfig, getStripeClient } from "@/lib/billing/stripe-checkout";
import { markSetupRequestPaidByCheckout, markSetupRequestPaymentFailedBySubscriptionId } from "@/lib/setup/setup-request-repository";
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

export async function POST(request: NextRequest) {
  const config = getStripeCheckoutConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, error: "MISSING_STRIPE_SIGNATURE" }, { status: 400 });
    }

    const payload = await request.text();
    const stripe = getStripeClient(config);
    const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.paymentPurpose === "SUBSCRIBER_BOOKING") {
        const bookingId = session.metadata.bookingId;
        const tenantSiteId = session.metadata.tenantSiteId;
        const siteSlug = session.metadata.siteSlug;
        if (bookingId && tenantSiteId && siteSlug) {
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
        return NextResponse.json({ ok: true });
      }
      const setupRequestId = session.metadata?.setupRequestId;
      if (setupRequestId) {
        const updated = await markSetupRequestPaidByCheckout({
          setupRequestId,
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
        });

        if (updated.tenantSiteId) {
          const existing = await prisma.subscriptionRecord.findFirst({
            where: { tenantSiteId: updated.tenantSiteId },
            select: { id: true },
          });

          if (existing) {
            await prisma.subscriptionRecord.update({
              where: { id: existing.id },
              data: {
                status: "ACTIVE",
                setupFeeGbp: updated.setupTotalGbp,
                monthlyFeeGbp: updated.monthlyTotalGbp,
                domainFeeGbp: Math.max(updated.setupTotalGbp - 149, 0),
              },
            });
          } else {
            await prisma.subscriptionRecord.create({
              data: {
                tenantSiteId: updated.tenantSiteId,
                status: "ACTIVE",
                setupFeeGbp: updated.setupTotalGbp,
                monthlyFeeGbp: updated.monthlyTotalGbp,
                domainFeeGbp: Math.max(updated.setupTotalGbp - 149, 0),
                whatsappAddonEnabled: false,
              },
            });
          }
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.paymentPurpose === "SUBSCRIBER_BOOKING") {
        const bookingId = session.metadata.bookingId;
        const tenantSiteId = session.metadata.tenantSiteId;
        if (bookingId && tenantSiteId) {
          await updateCustomerSiteBookingStatus(tenantSiteId, {
            bookingId,
            status: "CONFIRMED",
            paymentStatus: "FAILED",
            paymentMethod: "CARD_ONLINE",
            paymentProvider: "STRIPE",
            paymentProviderSessionId: session.id,
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.paymentPurpose === "SUBSCRIBER_BOOKING") {
        const bookingId = paymentIntent.metadata.bookingId;
        const tenantSiteId = paymentIntent.metadata.tenantSiteId;
        if (bookingId && tenantSiteId) {
          await updateCustomerSiteBookingStatus(tenantSiteId, {
            bookingId,
            status: "CONFIRMED",
            paymentStatus: "FAILED",
            paymentMethod: "CARD_ONLINE",
            paymentProvider: "STRIPE",
            paymentProviderPaymentIntentId: paymentIntent.id,
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const setupRequestId = subscription.metadata?.setupRequestId;
      if (setupRequestId && subscription.id) {
        await prisma.setupRequest.updateMany({
          where: { id: setupRequestId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId:
              typeof subscription.customer === "string" ? subscription.customer : undefined,
            paymentProvider: "STRIPE",
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.id) {
        await prisma.setupRequest.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            paymentStatus: "CANCELLED",
            paymentProvider: "STRIPE",
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : undefined;
      if (subscriptionId) {
        await markSetupRequestPaymentFailedBySubscriptionId(subscriptionId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_INVALID" }, { status: 400 });
  }
}
