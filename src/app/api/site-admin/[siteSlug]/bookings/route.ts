import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import {
  getCustomerSiteBookingById,
  listCustomerSiteBookings,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { updateCustomerSiteBookingStatusSchema } from "@/lib/sites/customer-site-booking-schema";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import {
  tenantBookingCustomerCancellation,
  tenantBookingCustomerConfirmation,
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
    const parsed = updateCustomerSiteBookingStatusSchema.parse({
      bookingId: body?.bookingId,
      status: body?.status,
      paymentStatus: body?.paymentStatus,
      notes: body?.notes,
    });
    const existing = await getCustomerSiteBookingById(resolved.tenantSiteId, parsed.bookingId);
    const booking = await updateCustomerSiteBookingStatus(resolved.tenantSiteId, parsed);
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
    };
    const shouldSendCustomerEmail =
      Boolean(booking.customerEmail) &&
      ((parsed.status === "CANCELLED" && existing?.status !== "CANCELLED") ||
        (parsed.status === "CONFIRMED" && existing?.status !== "CONFIRMED"));
    const emailStatus = shouldSendCustomerEmail
      ? await sendTransactionalEmail({
          to: booking.customerEmail ?? "",
          ...(parsed.status === "CANCELLED"
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
