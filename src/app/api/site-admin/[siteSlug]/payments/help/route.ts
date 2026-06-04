import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getSiteUrl } from "@/lib/billing/stripe-checkout";
import { getOptionalServerEnv, isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { prisma } from "@/lib/db/prisma";
import { sendTransactionalEmail } from "@/lib/email/email-provider";
import { paymentSetupHelpAdminNotification } from "@/lib/email/email-templates";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

const paymentHelpSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(160),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  phone: z.string().trim().max(60).nullable().optional(),
  provider: z.string().trim().min(1, "Please choose a payment provider first.").max(80),
  message: z.string().trim().min(5, "Please add a short note about what you need help with.").max(2000),
});

function backendNotConfigured() {
  return NextResponse.json({ ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" }, { status: 503 });
}

function emailStatusFromResult(result: Awaited<ReturnType<typeof sendTransactionalEmail>>): string {
  if (result.ok) return "SENT";
  return result.reason;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const session = await getSiteAdminSessionContext();
    if (!session) return NextResponse.json({ ok: false, error: "UNAUTHORISED" }, { status: 403 });

    const site = await getTenantSiteBySlug(siteSlug);
    if (!site) return NextResponse.json({ ok: false, error: "SITE_NOT_FOUND" }, { status: 404 });
    if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
      return NextResponse.json({ ok: false, error: "UNAUTHORISED" }, { status: 403 });
    }

    const parsed = paymentHelpSchema.parse(await request.json());
    const businessName = site.displayName;
    const baseUrl = getSiteUrl(new URL(request.url).origin).replace(/\/+$/, "");
    const adminUrl = `${baseUrl}/site-admin/${encodeURIComponent(site.slug)}#payments`;
    const supportEmail = getOptionalServerEnv("PLATFORM_NOTIFICATION_EMAIL");

    const enquiry = await prisma.customerSiteContactEnquiry.create({
      data: {
        tenantSiteId: site.id,
        purpose: "Payment setup help",
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        phone: parsed.phone?.trim() || null,
        message: [
          `Provider: ${parsed.provider}`,
          "",
          parsed.message,
        ].join("\n"),
        source: "site_admin_payment_setup_help",
      },
    });

    const emailResult = supportEmail
      ? await sendTransactionalEmail({
          to: supportEmail,
          ...paymentSetupHelpAdminNotification({
            businessName,
            siteSlug: site.slug,
            adminUrl,
            provider: parsed.provider,
            requesterName: parsed.name,
            requesterEmail: parsed.email,
            requesterPhone: parsed.phone,
            message: parsed.message,
          }),
          replyTo: parsed.email,
        })
      : ({ ok: false, skipped: true, reason: "EMAIL_NOT_CONFIGURED" } as const);

    const emailStatus = emailStatusFromResult(emailResult);
    await prisma.customerSiteContactEnquiry.update({
      where: { id: enquiry.id },
      data: { emailStatus },
    });

    return NextResponse.json({
      ok: true,
      enquiryId: enquiry.id,
      emailSent: emailResult.ok,
      emailStatus,
      message: emailResult.ok
        ? "Payment setup help request saved and emailed to MyExperiment.club support."
        : "Payment setup help request saved, but the support email could not be sent automatically.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: "VALIDATION_ERROR", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, error: "PAYMENT_SETUP_HELP_REQUEST_FAILED", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
