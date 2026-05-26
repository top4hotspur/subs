import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { createCustomerSiteBooking } from "@/lib/sites/customer-site-booking-repository";
import { createCustomerSiteBookingSchema } from "@/lib/sites/customer-site-booking-schema";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { tenantBookingCustomerConfirmation } from "@/lib/email/email-templates";
import { sendTransactionalEmail } from "@/lib/email/email-provider";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
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
    const booking = await createCustomerSiteBooking(site.tenantSite.id, {
      ...parsed,
      source: "customer_site",
    });
    const siteName =
      site.settings?.siteDisplayName ||
      site.settings?.businessName ||
      site.tenantSite.displayName ||
      "Your business";
    const bookingEmailStatus = booking.customerEmail
      ? await sendTransactionalEmail({
          to: booking.customerEmail,
          ...tenantBookingCustomerConfirmation(booking, { siteName }),
          replyTo: site.settings?.email ?? undefined,
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
