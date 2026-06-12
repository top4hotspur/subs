import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import {
  createCustomerSiteBooking,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { createCustomerSiteBookingSchema } from "@/lib/sites/customer-site-booking-schema";
import { calculateCustomerSiteAvailability } from "@/lib/sites/customer-site-availability";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import {
  tenantBookingBusinessNotification,
  tenantBookingCustomerConfirmation,
} from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { getSiteCustomerSessionContext } from "@/lib/auth/site-customer-session";
import { createBookingAccessUrl } from "@/lib/sites/booking-access-token";
import {
  customerSitePaymentBlockMessage,
  getCustomerSiteBookingPaymentDecision,
} from "@/lib/sites/customer-site-payment-policy";
import { hasConnectedProviderCheckout, normalizePaymentProviderKey } from "@/lib/sites/payment-provider-connections";
import {
  createStripeTenantBookingCheckoutSession,
  isStripeConnectionCheckoutReady,
} from "@/lib/billing/stripe-tenant-checkout";
import { getLiveTenantSiteByDomainHost } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

function absoluteSiteAdminUrl(siteSlug: string): string {
  const baseUrl = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  const path = `/site-admin/${encodeURIComponent(siteSlug)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

function requestHost(request: NextRequest): string {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
}

function priceToPence(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const site = await getCustomerSitePreviewDataBySlug(siteSlug);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createCustomerSiteBookingSchema.parse(body);
    const customerSession = await getSiteCustomerSessionContext();
    const customerSiteCustomerId =
      customerSession?.tenantSiteId === site.tenantSite.id &&
      customerSession.tenantSlug === site.tenantSite.slug
        ? customerSession.customerId
        : undefined;
    const availability = await calculateCustomerSiteAvailability({
      siteSlug,
      serviceId: parsed.serviceId,
      staffId: parsed.staffMemberId ?? null,
      date: parsed.preferredDate,
    });
    const matchingSlot = availability.slots.find(
      (slot) =>
        slot.serviceId === parsed.serviceId &&
        (!parsed.staffMemberId || slot.staffMemberId === parsed.staffMemberId) &&
        slot.date === parsed.preferredDate &&
        slot.startTime === parsed.preferredTime,
    );
    if (!matchingSlot) {
      return NextResponse.json({ ok: false, error: "BOOKING_SLOT_UNAVAILABLE" }, { status: 409 });
    }
    const selectedProvider = normalizePaymentProviderKey(site.settings?.paymentProcessorName);
    const selectedConnection = site.paymentProviderConnections.find((connection) => connection.provider === selectedProvider);
    const tenantCheckoutAvailable = hasConnectedProviderCheckout({
      connection: selectedConnection,
      checkoutImplemented: selectedProvider === "STRIPE" && isStripeConnectionCheckoutReady(selectedConnection),
    });
    const paymentDecision = getCustomerSiteBookingPaymentDecision({
      ...site.settings,
      paymentProviderConnected: selectedConnection?.connectionStatus === "CONNECTED" && selectedConnection.publicEnabled,
      paymentProviderCheckoutEnabled: tenantCheckoutAvailable,
    });
    const paymentCurrency = (site.settings?.currency ?? "GBP").toUpperCase();

    if (!paymentDecision.canCreateBooking) {
      return NextResponse.json(
        {
          ok: false,
          error:
            paymentDecision.blockedReason === "ONLINE_PAYMENT_NOT_CONNECTED"
              ? "ONLINE_PAYMENT_NOT_CONFIGURED"
              : "BOOKING_PAYMENT_METHOD_UNAVAILABLE",
          message: paymentDecision.publicCopy || customerSitePaymentBlockMessage(paymentDecision.blockedReason),
        },
        { status: 400 },
      );
    }

    const servicePaymentDetails =
      paymentDecision.paymentMethod === "CARD_ONLINE"
        ? await prisma.customerSiteService.findFirst({
            where: { id: parsed.serviceId, tenantSiteId: site.tenantSite.id, active: true },
            select: { basePrice: true, name: true },
          })
        : null;
    const paymentAmountPence =
      paymentDecision.paymentMethod === "CARD_ONLINE"
        ? priceToPence(servicePaymentDetails?.basePrice)
        : null;
    if (paymentDecision.paymentMethod === "CARD_ONLINE" && (!paymentAmountPence || paymentAmountPence <= 0)) {
      return NextResponse.json(
        {
          ok: false,
          error: "BOOKING_PAYMENT_AMOUNT_REQUIRED",
          message: "This service needs a fixed price before secure online payment can be taken.",
        },
        { status: 400 },
      );
    }

    const booking = await createCustomerSiteBooking(site.tenantSite.id, {
      ...parsed,
      customerEmail: parsed.customerEmail.toLowerCase(),
      staffMemberId: matchingSlot.staffMemberId,
      staffName: matchingSlot.staffName,
      status: "CONFIRMED",
      paymentStatus: paymentDecision.paymentStatus,
      paymentMethod: paymentDecision.paymentMethod,
      paymentAmountPence: paymentAmountPence ?? undefined,
      paymentCurrency:
        paymentDecision.paymentStatus === "PENDING" && paymentDecision.paymentMethod !== "NONE"
          ? paymentCurrency
          : undefined,
      paymentProvider: paymentDecision.paymentMethod === "CARD_ONLINE" ? "STRIPE" : undefined,
      paymentProviderAccountId:
        paymentDecision.paymentMethod === "CARD_ONLINE" ? selectedConnection?.providerAccountId ?? undefined : undefined,
      source: "customer_site",
      customerSiteCustomerId,
    });

    if (paymentDecision.paymentMethod === "CARD_ONLINE") {
      try {
        if (!selectedConnection?.providerAccountId) {
          throw new Error("STRIPE_CONNECTED_ACCOUNT_REQUIRED");
        }
        const checkoutSession = await createStripeTenantBookingCheckoutSession({
          siteSlug: site.tenantSite.slug,
          tenantSiteId: site.tenantSite.id,
          bookingId: booking.id,
          serviceId: parsed.serviceId,
          serviceName: servicePaymentDetails?.name ?? booking.serviceName ?? parsed.serviceName ?? "Booking",
          staffId: matchingSlot.staffMemberId,
          customerEmail: booking.customerEmail ?? parsed.customerEmail,
          customerName: booking.customerName,
          amountPence: paymentAmountPence ?? 0,
          currency: paymentCurrency,
          origin: request.nextUrl.origin,
          connectedAccountId: selectedConnection.providerAccountId,
        });
        if (!checkoutSession.url) {
          throw new Error("BOOKING_CHECKOUT_SESSION_FAILED");
        }
        const updatedBooking = await updateCustomerSiteBookingStatus(site.tenantSite.id, {
          bookingId: booking.id,
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          paymentMethod: "CARD_ONLINE",
          paymentAmountPence: paymentAmountPence ?? undefined,
          paymentCurrency,
          paymentProvider: "STRIPE",
          paymentProviderAccountId: selectedConnection.providerAccountId,
          paymentProviderSessionId: checkoutSession.id,
          paymentProviderPaymentIntentId:
            typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : undefined,
          paymentProviderCheckoutExpiresAt: checkoutSession.expires_at ? new Date(checkoutSession.expires_at * 1000) : undefined,
        });

        return NextResponse.json(
          {
            ok: true,
            booking: updatedBooking,
            checkoutUrl: checkoutSession.url,
            checkoutSessionId: checkoutSession.id,
            emailStatus: { customer: { skipped: true, reason: "PAYMENT_PENDING" }, business: { skipped: true, reason: "PAYMENT_PENDING" } },
          },
          { status: 201 },
        );
      } catch (checkoutError) {
        await updateCustomerSiteBookingStatus(site.tenantSite.id, {
          bookingId: booking.id,
          status: "CANCELLED",
          paymentStatus: "FAILED",
          paymentMethod: "CARD_ONLINE",
          paymentAmountPence: paymentAmountPence ?? undefined,
          paymentCurrency,
          paymentProvider: "STRIPE",
          paymentProviderAccountId: selectedConnection?.providerAccountId ?? undefined,
          notes: "Secure checkout could not be started. The customer was asked to contact the business.",
        }).catch(() => null);
        return NextResponse.json(
          {
            ok: false,
            error:
              checkoutError instanceof Error && checkoutError.message === "STRIPE_TENANT_CHECKOUT_NOT_CONFIGURED"
                ? "ONLINE_PAYMENT_NOT_CONFIGURED"
                : "BOOKING_CHECKOUT_SESSION_FAILED",
            message: "We could not start secure payment. Please contact the business to book.",
          },
          { status: 503 },
        );
      }
    }

    const siteName =
      site.settings?.siteDisplayName ||
      site.settings?.businessName ||
      site.tenantSite.displayName ||
      "Your business";
    const tenantHostMatch = await getLiveTenantSiteByDomainHost(requestHost(request));
    const isTenantHost = tenantHostMatch?.tenantSlug === site.tenantSite.slug;
    const publicBasePath = isTenantHost ? "" : `/sites/${encodeURIComponent(site.tenantSite.slug)}`;
    const bookingUrl = createBookingAccessUrl({
      baseUrl: request.nextUrl.origin,
      siteSlug: site.tenantSite.slug,
      tenantSiteId: site.tenantSite.id,
      bookingId: booking.id,
      publicBasePath,
    });
    const siteSummary = {
      siteName,
      siteSlug: site.tenantSite.slug,
      contactEmail: site.settings?.email ?? null,
      contactPhone: site.settings?.phone ?? null,
      adminUrl: isTenantHost ? `${request.nextUrl.origin}/site-admin` : absoluteSiteAdminUrl(site.tenantSite.slug),
      bookingUrl,
    };
    const customerEmailStatus = booking.customerEmail
      ? await sendTransactionalEmail({
          to: booking.customerEmail,
          ...tenantBookingCustomerConfirmation(booking, siteSummary),
          replyTo: site.settings?.email ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };
    const businessEmailStatus = site.settings?.email
      ? await sendTransactionalEmail({
          to: site.settings.email,
          ...tenantBookingBusinessNotification(booking, siteSummary),
          replyTo: booking.customerEmail ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };

    return NextResponse.json(
      {
        ok: true,
        booking,
        bookingUrl,
        checkoutUrl: null,
        checkoutSessionId: null,
        emailStatus: { customer: customerEmailStatus, business: businessEmailStatus },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "BOOKING_SLOT_CONFLICT") {
      return NextResponse.json({ ok: false, error: "BOOKING_SLOT_CONFLICT" }, { status: 409 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "BOOKING_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
