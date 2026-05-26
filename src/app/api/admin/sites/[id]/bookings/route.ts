import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  createCustomerSiteBooking,
  listCustomerSiteBookings,
} from "@/lib/sites/customer-site-booking-repository";
import {
  createCustomerSiteBookingSchema,
  listCustomerSiteBookingsSchema,
} from "@/lib/sites/customer-site-booking-schema";
import { getTenantSiteById } from "@/lib/sites/site-provisioning-repository";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { tenantBookingCustomerConfirmation } from "@/lib/email/email-templates";
import { getCustomerSiteSettings } from "@/lib/sites/customer-site-settings-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const params = request.nextUrl.searchParams;
    const parsed = listCustomerSiteBookingsSchema.parse({
      status: params.get("status") ?? undefined,
      preferredDate: params.get("preferredDate") ?? undefined,
      take: params.get("take") ?? undefined,
      skip: params.get("skip") ?? undefined,
    });
    const bookings = await listCustomerSiteBookings(id, parsed);
    return NextResponse.json({ ok: true, bookings });
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
        error: "BOOKINGS_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const site = await getTenantSiteById(id);
    if (!site) {
      return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createCustomerSiteBookingSchema.parse(body);
    const booking = await createCustomerSiteBooking(id, parsed);
    const settings = await getCustomerSiteSettings(id);
    const siteName = settings?.siteDisplayName || settings?.businessName || site.displayName || "Your business";
    const bookingEmailStatus = booking.customerEmail
      ? await sendTransactionalEmail({
          to: booking.customerEmail,
          ...tenantBookingCustomerConfirmation(booking, { siteName }),
          replyTo: settings?.email ?? undefined,
        })
      : { ok: false as const, skipped: true as const, reason: "EMAIL_NOT_CONFIGURED" as const };
    return NextResponse.json({ ok: true, booking, emailStatus: bookingEmailStatus }, { status: 201 });
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
