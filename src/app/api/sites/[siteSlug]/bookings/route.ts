import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { createCustomerSiteBooking } from "@/lib/sites/customer-site-booking-repository";
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
    const paymentDecision = getCustomerSiteBookingPaymentDecision(site.settings);
    const paymentCurrency = (site.settings?.currency ?? "GBP").toUpperCase();

    if (!paymentDecision.canCreateBooking) {
      return NextResponse.json(
        {
          ok: false,
          error:
            paymentDecision.blockedReason === "ONLINE_PAYMENT_NOT_CONNECTED"
              ? "ONLINE_PAYMENT_NOT_CONFIGURED"
              : "BOOKING_PAYMENT_METHOD_UNAVAILABLE",
          message: customerSitePaymentBlockMessage(paymentDecision.blockedReason),
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
      paymentCurrency:
        paymentDecision.paymentStatus === "PENDING" && paymentDecision.paymentMethod !== "NONE"
          ? paymentCurrency
          : undefined,
      source: "customer_site",
      customerSiteCustomerId,
    });
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
      adminUrl: absoluteSiteAdminUrl(site.tenantSite.slug),
      bookingUrl: createBookingAccessUrl({
        baseUrl: getOptionalServerEnv("NEXT_PUBLIC_SITE_URL"),
        siteSlug: site.tenantSite.slug,
        tenantSiteId: site.tenantSite.id,
        bookingId: booking.id,
      }),
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
