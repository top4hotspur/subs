import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { getStripeCheckoutConfig, getStripeClient } from "@/lib/billing/stripe-checkout";
import { markSetupRequestPaidByCheckout, markSetupRequestPaymentFailedBySubscriptionId } from "@/lib/setup/setup-request-repository";

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
      if (session.metadata?.paymentPurpose === "PLATFORM_BILLING_TEST") {
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
