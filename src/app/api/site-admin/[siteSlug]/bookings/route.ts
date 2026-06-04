import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import {
  amendCustomerSiteBooking,
  getCustomerSiteBookingById,
  listCustomerSiteBookings,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import {
  amendCustomerSiteBookingSchema,
  updateCustomerSiteBookingStatusSchema,
} from "@/lib/sites/customer-site-booking-schema";
import { calculateCustomerSiteAvailability } from "@/lib/sites/customer-site-availability";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getBookingRefundGuidance } from "@/lib/sites/booking-cancellation-refund";
import { createBookingAccessUrl } from "@/lib/sites/booking-access-token";
import { getOptionalServerEnv } from "@/lib/config/server-env";
import {
  tenantBookingCustomerCancellation,
  tenantBookingCustomerConfirmation,
  tenantBookingCustomerUpdated,
} from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveSiteAdminTenantBySlug(siteSlug);
    if (!resolved.ok) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const takeRaw = request.nextUrl.searchParams.get("take");
    const take = takeRaw ? Number(takeRaw) : 20;
    const bookings = await listCustomerSiteBookings(resolved.tenantSiteId, {
      take: Number.isFinite(take) ? Math.max(1, Math.min(100, take)) : 20,
    });
    return NextResponse.json({ ok: true, bookings });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_BOOKINGS_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveSiteAdminTenantBySlug(siteSlug);
    if (!resolved.ok) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const body = await request.json();
    const action = body?.action === "amend" ? "amend" : "status";
    let booking;
    let emailKind: "updated" | "cancelled" | "confirmed" | null = null;
    let existing;
    if (action === "amend") {
      const parsed = amendCustomerSiteBookingSchema.parse({
        bookingId: body?.bookingId,
        customerName: body?.customerName,
        customerEmail: body?.customerEmail,
        customerPhone: body?.customerPhone,
        notes: body?.notes,
        status: body?.status,
        serviceId: body?.serviceId,
        staffMemberId: body?.staffMemberId,
        preferredDate: body?.preferredDate,
        preferredTime: body?.preferredTime,
      });
      existing = await getCustomerSiteBookingById(resolved.tenantSiteId, parsed.bookingId);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "BOOKING_NOT_FOUND" }, { status: 404 });
      }
      if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
        return NextResponse.json({ ok: false, error: "BOOKING_AMEND_NOT_ALLOWED" }, { status: 400 });
      }
      const wantsReschedule = Boolean(parsed.serviceId || parsed.preferredDate || parsed.preferredTime || parsed.staffMemberId !== undefined);
      if (wantsReschedule) {
        const serviceId = parsed.serviceId ?? existing.serviceId ?? "";
        const preferredDate = parsed.preferredDate ?? existing.preferredDate ?? "";
        const preferredTime = parsed.preferredTime ?? existing.preferredTime ?? "";
        const staffId = parsed.staffMemberId === undefined ? existing.staffMemberId : parsed.staffMemberId;
        const availability = await calculateCustomerSiteAvailability({
          siteSlug,
          serviceId,
          staffId,
          date: preferredDate,
          excludeBookingId: existing.id,
          includeDebug: true,
        });
        const matchingSlot = availability.slots.find(
          (slot) =>
            slot.serviceId === serviceId &&
            (!staffId || slot.staffMemberId === staffId) &&
            slot.date === preferredDate &&
            slot.startTime === preferredTime,
        );
        if (!matchingSlot) {
          return NextResponse.json({ ok: false, error: "BOOKING_SLOT_UNAVAILABLE" }, { status: 409 });
        }
        booking = await amendCustomerSiteBooking(resolved.tenantSiteId, {
          ...parsed,
          serviceId,
          preferredDate,
          preferredTime,
          staffMemberId: matchingSlot.staffMemberId,
        });
      } else {
        booking = await amendCustomerSiteBooking(resolved.tenantSiteId, parsed);
      }
      emailKind = "updated";
    } else {
      const siteForPolicy = await getCustomerSitePreviewDataBySlug(siteSlug);
      const refundAction = typeof body?.refundAction === "string" ? body.refundAction : "CANCEL_ONLY";
      const parsed = updateCustomerSiteBookingStatusSchema.parse({
        bookingId: body?.bookingId,
        status: body?.status,
        paymentStatus: body?.paymentStatus,
        refundStatus: body?.refundStatus,
        refundGuidance: body?.refundGuidance,
        cancellationReason: body?.cancellationReason,
        notes: body?.notes,
      });
      existing = await getCustomerSiteBookingById(resolved.tenantSiteId, parsed.bookingId);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "BOOKING_NOT_FOUND" }, { status: 404 });
      }
      if (parsed.status === "CANCELLED" && existing.status !== "CANCELLED") {
        const guidance = getBookingRefundGuidance({
          booking: existing,
          fullRefundNoticeDays: siteForPolicy?.settings?.cancellationFullRefundNoticeDays,
          noRefundWithinDays: siteForPolicy?.settings?.cancellationNoRefundWithinDays,
        });
        let refundStatus = guidance.refundStatus;
        let refundGuidance = guidance.refundGuidance;
        if (
          existing.paymentMethod === "CARD_ONLINE" &&
          existing.paymentStatus === "PENDING" &&
          (parsed.paymentStatus === "EXPIRED" || parsed.paymentStatus === "FAILED")
        ) {
          refundStatus = "NOT_REQUIRED";
          refundGuidance = "No refund is required because Stripe payment was not completed.";
        } else if (refundAction === "MANUAL_REFUND_HANDLED" && existing.paymentMethod !== "CARD_ONLINE") {
          refundStatus = "REFUNDED";
          refundGuidance = "Manual refund/payment handling has been marked as handled by the business.";
        } else if (refundAction === "NO_REFUND") {
          refundStatus = "DECLINED";
          refundGuidance = "The booking has been cancelled with no refund recorded.";
        } else if (existing.paymentMethod === "CARD_ONLINE" && (existing.paymentStatus === "PAID" || existing.paymentStatus === "PAYMENT_COMPLETED")) {
          refundStatus = "MANUAL_REQUIRED";
          refundGuidance = "Online refund is not connected yet. Cancel the booking and process any refund manually in your payment provider.";
        }
        booking = await updateCustomerSiteBookingStatus(resolved.tenantSiteId, {
          ...parsed,
          refundStatus,
          refundGuidance,
          cancellationReason: parsed.cancellationReason,
          cancelledAt: new Date(),
        });
      } else {
        booking = await updateCustomerSiteBookingStatus(resolved.tenantSiteId, parsed);
      }
      if (parsed.status === "CANCELLED" && existing.status !== "CANCELLED") emailKind = "cancelled";
      if (parsed.status === "CONFIRMED" && existing.status !== "CONFIRMED") emailKind = "confirmed";
    }
    const site = await getCustomerSitePreviewDataBySlug(siteSlug);
    const siteName =
      site?.settings?.siteDisplayName ||
      site?.settings?.businessName ||
      site?.tenantSite.displayName ||
      "Your business";
    const siteSummary = {
      siteName,
      siteSlug: site?.tenantSite.slug ?? siteSlug,
      contactEmail: site?.settings?.email ?? null,
      contactPhone: site?.settings?.phone ?? null,
      bookingUrl: site
        ? createBookingAccessUrl({
            baseUrl: getOptionalServerEnv("NEXT_PUBLIC_SITE_URL"),
            siteSlug: site.tenantSite.slug,
            tenantSiteId: resolved.tenantSiteId,
            bookingId: booking.id,
          })
        : null,
    };
    const shouldSendCustomerEmail =
      Boolean(booking.customerEmail) && emailKind !== null;
    const emailStatus = shouldSendCustomerEmail
      ? await sendTransactionalEmail({
          to: booking.customerEmail ?? "",
          ...(emailKind === "updated"
            ? tenantBookingCustomerUpdated(booking, siteSummary)
            : emailKind === "cancelled"
            ? tenantBookingCustomerCancellation(booking, siteSummary)
            : tenantBookingCustomerConfirmation(booking, siteSummary)),
          replyTo: site?.settings?.email ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };
    return NextResponse.json({ ok: true, booking, emailStatus });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "BOOKING_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_BOOKING_STATUS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
