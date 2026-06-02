import { NextRequest, NextResponse } from "next/server";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { resolveSiteAdminTenantBySlug } from "@/lib/auth/site-admin-tenant";
import {
  listCustomerSiteBookings,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { updateCustomerSiteBookingStatusSchema } from "@/lib/sites/customer-site-booking-schema";
import { ZodError } from "zod";

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
    const booking = await updateCustomerSiteBookingStatus(resolved.tenantSiteId, parsed);
    return NextResponse.json({ ok: true, booking });
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
