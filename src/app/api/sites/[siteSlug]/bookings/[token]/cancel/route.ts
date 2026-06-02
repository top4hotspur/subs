import { NextRequest, NextResponse } from "next/server";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getCustomerSiteBookingById,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { verifyBookingAccessToken } from "@/lib/sites/booking-access-token";
import { getBookingRefundGuidance } from "@/lib/sites/booking-cancellation-refund";
import {
  tenantBookingBusinessCancellationNotification,
  tenantBookingCustomerCancellation,
} from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";

function redirectToBooking(request: NextRequest, siteSlug: string, token: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return NextResponse.redirect(
    new URL(`/sites/${encodeURIComponent(siteSlug)}/booking/${encodeURIComponent(token)}?${query.toString()}`, request.url),
  );
}

function canCustomerCancel(booking: {
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  startDateTime: string | null;
}): "ok" | "paid" | "card" | "status" | "past" {
  if (booking.status !== "CONFIRMED" && booking.status !== "REQUESTED" && booking.status !== "SUBMITTED") return "status";
  if (booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED") return "paid";
  if (booking.paymentMethod === "CARD_ONLINE") return "card";
  if (booking.startDateTime && new Date(booking.startDateTime).getTime() <= Date.now()) return "past";
  return "ok";
}

function absoluteSiteAdminUrl(siteSlug: string): string {
  const baseUrl = getOptionalServerEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  const path = `/site-admin/${encodeURIComponent(siteSlug)}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string; token: string }> },
) {
  const { siteSlug, token } = await context.params;
  if (!isBackendPersistenceConfigured()) {
    return redirectToBooking(request, siteSlug, token, { error: "backend" });
  }

  const verified = verifyBookingAccessToken(token);
  if (!verified || verified.siteSlug !== siteSlug) {
    return redirectToBooking(request, siteSlug, token, { error: "invalid" });
  }

  const site = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!site || site.tenantSite.id !== verified.tenantSiteId) {
    return redirectToBooking(request, siteSlug, token, { error: "invalid" });
  }

  const booking = await getCustomerSiteBookingById(site.tenantSite.id, verified.bookingId);
  if (!booking) {
    return redirectToBooking(request, siteSlug, token, { error: "invalid" });
  }

  const eligibility = canCustomerCancel(booking);
  if (eligibility !== "ok") {
    return redirectToBooking(request, siteSlug, token, { error: eligibility });
  }

  const form = await request.formData();
  const reasonRaw = form.get("reason");
  const reason = typeof reasonRaw === "string" && reasonRaw.trim()
    ? reasonRaw.trim().slice(0, 1200)
    : "Cancelled by customer from secure booking link.";
  const guidance = getBookingRefundGuidance({
    booking,
    fullRefundNoticeDays: site.settings?.cancellationFullRefundNoticeDays,
    noRefundWithinDays: site.settings?.cancellationNoRefundWithinDays,
  });
  const updated = await updateCustomerSiteBookingStatus(site.tenantSite.id, {
    bookingId: booking.id,
    status: "CANCELLED",
    refundStatus: guidance.refundStatus,
    refundGuidance: guidance.refundGuidance,
    cancellationReason: reason,
    cancelledAt: new Date(),
  });

  const siteName =
    site.settings?.siteDisplayName ||
    site.settings?.businessName ||
    site.tenantSite.displayName ||
    "Your business";
  const summary = {
    siteName,
    siteSlug: site.tenantSite.slug,
    contactEmail: site.settings?.email ?? null,
    contactPhone: site.settings?.phone ?? null,
    adminUrl: absoluteSiteAdminUrl(site.tenantSite.slug),
  };

  if (updated.customerEmail) {
    await sendTransactionalEmail({
      to: updated.customerEmail,
      ...tenantBookingCustomerCancellation(updated, summary),
      replyTo: site.settings?.email ?? undefined,
    });
  }
  if (site.settings?.email) {
    await sendTransactionalEmail({
      to: site.settings.email,
      ...tenantBookingBusinessCancellationNotification(updated, summary),
      replyTo: updated.customerEmail ?? undefined,
    });
  }

  return redirectToBooking(request, siteSlug, token, { cancelled: "1" });
}
