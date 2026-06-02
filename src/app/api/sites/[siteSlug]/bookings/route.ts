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
    const requiresPrepayment = Boolean(site.settings?.requireBookingPrepayment && site.settings.acceptCardPayments);
    const paymentStatus = requiresPrepayment
      ? "PENDING"
      : site.settings?.acceptCashPayments
        ? "PENDING"
        : "NOT_REQUIRED";
    const paymentMethod = requiresPrepayment
      ? "CARD_ONLINE"
      : site.settings?.acceptCashPayments
        ? "CASH"
        : "NONE";
    const booking = await createCustomerSiteBooking(site.tenantSite.id, {
      ...parsed,
      staffMemberId: matchingSlot.staffMemberId,
      staffName: matchingSlot.staffName,
      status: "CONFIRMED",
      paymentStatus,
      paymentMethod,
      source: "customer_site",
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
      { ok: true, booking, emailStatus: { customer: customerEmailStatus, business: businessEmailStatus } },
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
