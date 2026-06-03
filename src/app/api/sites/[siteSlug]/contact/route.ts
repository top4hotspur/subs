import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSiteCustomerSessionContext } from "@/lib/auth/site-customer-session";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { contactEnquiryAdminNotification } from "@/lib/email/email-templates";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

const contactSchema = z.object({
  purpose: z.enum([
    "Change my booking",
    "Cancel my booking",
    "Payment question",
    "General enquiry",
    "Complaint / problem",
    "Other",
  ]),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(60).nullable().optional(),
  message: z.string().trim().min(1).max(3000),
  bookingId: z.string().cuid().nullable().optional(),
});

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    const parsed = contactSchema.parse(await request.json());
    const session = await getSiteCustomerSessionContext();
    const customerSiteCustomerId =
      session?.tenantSiteId === site.id && session.tenantSlug === site.slug
        ? session.customerId
        : null;
    const booking = parsed.bookingId
      ? await prisma.customerSiteBooking.findFirst({
          where: { id: parsed.bookingId, tenantSiteId: site.id },
          select: { id: true },
        })
      : null;

    const enquiry = await prisma.customerSiteContactEnquiry.create({
      data: {
        tenantSiteId: site.id,
        customerSiteCustomerId,
        bookingId: booking?.id ?? null,
        purpose: parsed.purpose,
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        phone: parsed.phone?.trim() || null,
        message: parsed.message,
        source: "customer_site_contact",
      },
    });

    const settings = await prisma.customerSiteSettings.findUnique({
      where: { tenantSiteId: site.id },
      select: { email: true, businessName: true, siteDisplayName: true },
    });
    const businessEmail = settings?.email?.trim();
    const emailResult = businessEmail
      ? await sendTransactionalEmail({
          to: businessEmail,
          ...contactEnquiryAdminNotification({
            name: parsed.name,
            businessName: settings?.siteDisplayName || settings?.businessName || site.displayName,
            email: parsed.email,
            phone: parsed.phone,
            message: [
              `Purpose: ${parsed.purpose}`,
              booking?.id ? `Booking reference: ${booking.id}` : null,
              "",
              parsed.message,
            ].filter(Boolean).join("\n"),
            source: "subscriber-site-contact",
          }),
          replyTo: parsed.email,
        })
      : { ok: false as const, reason: "BUSINESS_EMAIL_NOT_SET" as const };

    await prisma.customerSiteContactEnquiry.update({
      where: { id: enquiry.id },
      data: { emailStatus: emailResult.ok ? "SENT" : emailResult.reason },
    });

    return NextResponse.json({
      ok: true,
      enquiryId: enquiry.id,
      emailSent: emailResult.ok,
      emailStatus: emailResult.ok ? "SENT" : emailResult.reason,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "CUSTOMER_CONTACT_ENQUIRY_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
