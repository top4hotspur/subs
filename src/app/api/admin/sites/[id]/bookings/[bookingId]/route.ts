import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getCustomerSiteBookingById,
  updateCustomerSiteBookingStatus,
} from "@/lib/sites/customer-site-booking-repository";
import { updateCustomerSiteBookingStatusSchema } from "@/lib/sites/customer-site-booking-schema";
import { getTenantSiteById } from "@/lib/sites/site-provisioning-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; bookingId: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id, bookingId } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const existing = await getCustomerSiteBookingById(id, bookingId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "BOOKING_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateCustomerSiteBookingStatusSchema.parse({
      bookingId,
      status: body?.status,
      paymentStatus: body?.paymentStatus,
      notes: body?.notes,
    });

    const booking = await updateCustomerSiteBookingStatus(id, parsed);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "BOOKING_STATUS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

