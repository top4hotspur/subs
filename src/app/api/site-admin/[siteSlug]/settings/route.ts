import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import { getCustomerSiteSettings, upsertCustomerSiteSettings } from "@/lib/sites/customer-site-settings-repository";
import { upsertCustomerSiteSettingsSchema } from "@/lib/sites/customer-site-settings-schema";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

async function resolveAuthorizedTenant(siteSlug: string) {
  const session = await getSiteAdminSessionContext();
  if (!session) return { error: "FORBIDDEN", status: 403 as const };
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { error: "SITE_NOT_FOUND", status: 404 as const };
  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { error: "FORBIDDEN", status: 403 as const };
  }
  return { tenantSiteId: site.id };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ siteSlug: string }> },
) {
  if (!isBackendPersistenceConfigured()) return backendNotConfigured();

  try {
    const { siteSlug } = await context.params;
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const settings = await getCustomerSiteSettings(resolved.tenantSiteId);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_ADMIN_SETTINGS_GET_FAILED",
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
    const resolved = await resolveAuthorizedTenant(siteSlug);
    if ("error" in resolved) {
      return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
    }

    const body = await request.json();
    const parsed = upsertCustomerSiteSettingsSchema.parse({
      tenantSiteId: resolved.tenantSiteId,
      siteDisplayName: body?.siteDisplayName,
      businessName: body?.businessName,
      phone: body?.phone,
      email: body?.email,
      address: body?.address,
      openingHoursSummary: body?.openingHoursSummary,
      openingHoursJson: body?.openingHoursJson,
      heroHeadline: body?.heroHeadline,
      heroSubheading: body?.heroSubheading,
      visualThemeId: body?.visualThemeId,
      colourPaletteId: body?.colourPaletteId,
      currency: body?.currency,
      paymentProcessorSetupMode: body?.paymentProcessorSetupMode,
      paymentProcessorName: body?.paymentProcessorName,
      paymentProcessorAccountRef: body?.paymentProcessorAccountRef,
      paymentProcessorNotes: body?.paymentProcessorNotes,
      acceptCashPayments: body?.acceptCashPayments,
      acceptCardPayments: body?.acceptCardPayments,
      requireBookingPrepayment: body?.requireBookingPrepayment,
      allowInStorePaymentRecording: body?.allowInStorePaymentRecording,
      cancellationFullRefundNoticeDays: body?.cancellationFullRefundNoticeDays,
      cancellationNoRefundWithinDays: body?.cancellationNoRefundWithinDays,
      cancellationPolicyNote: body?.cancellationPolicyNote,
      aboutPageEnabled: body?.aboutPageEnabled,
      policyPageEnabled: body?.policyPageEnabled,
      aboutPageMode: body?.aboutPageMode,
      aboutTitle: body?.aboutTitle,
      aboutBody: body?.aboutBody,
      aboutImageOneUrl: body?.aboutImageOneUrl,
      aboutImageTwoUrl: body?.aboutImageTwoUrl,
      aboutImagePlacement: body?.aboutImagePlacement,
      aboutStaffProfilesJson: body?.aboutStaffProfilesJson,
      contactTitle: body?.contactTitle,
      contactIntro: body?.contactIntro,
      contactMapEnabled: body?.contactMapEnabled,
      contactMapNote: body?.contactMapNote,
      policyTitle: body?.policyTitle,
      policyIntro: body?.policyIntro,
      policyBody: body?.policyBody,
      socialLinks: body?.socialLinks,
    });

    const settings = await upsertCustomerSiteSettings(resolved.tenantSiteId, {
      siteDisplayName: parsed.siteDisplayName,
      businessName: parsed.businessName,
      phone: parsed.phone,
      email: parsed.email,
      address: parsed.address,
      openingHoursSummary: parsed.openingHoursSummary,
      openingHoursJson: parsed.openingHoursJson,
      heroHeadline: parsed.heroHeadline,
      heroSubheading: parsed.heroSubheading,
      visualThemeId: parsed.visualThemeId,
      colourPaletteId: parsed.colourPaletteId,
      currency: parsed.currency,
      paymentProcessorSetupMode: parsed.paymentProcessorSetupMode,
      paymentProcessorName: parsed.paymentProcessorName,
      paymentProcessorAccountRef: parsed.paymentProcessorAccountRef,
      paymentProcessorNotes: parsed.paymentProcessorNotes,
      acceptCashPayments: parsed.acceptCashPayments,
      acceptCardPayments: parsed.acceptCardPayments,
      requireBookingPrepayment: parsed.requireBookingPrepayment,
      allowInStorePaymentRecording: parsed.allowInStorePaymentRecording,
      cancellationFullRefundNoticeDays: parsed.cancellationFullRefundNoticeDays,
      cancellationNoRefundWithinDays: parsed.cancellationNoRefundWithinDays,
      cancellationPolicyNote: parsed.cancellationPolicyNote,
      aboutPageEnabled: parsed.aboutPageEnabled,
      policyPageEnabled: parsed.policyPageEnabled,
      aboutPageMode: parsed.aboutPageMode,
      aboutTitle: parsed.aboutTitle,
      aboutBody: parsed.aboutBody,
      aboutImageOneUrl: parsed.aboutImageOneUrl,
      aboutImageTwoUrl: parsed.aboutImageTwoUrl,
      aboutImagePlacement: parsed.aboutImagePlacement,
      aboutStaffProfilesJson: parsed.aboutStaffProfilesJson,
      contactTitle: parsed.contactTitle,
      contactIntro: parsed.contactIntro,
      contactMapEnabled: parsed.contactMapEnabled,
      contactMapNote: parsed.contactMapNote,
      policyTitle: parsed.policyTitle,
      policyIntro: parsed.policyIntro,
      policyBody: parsed.policyBody,
      socialLinks: parsed.socialLinks,
    });
    return NextResponse.json({ ok: true, settings });
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
        error: "SITE_ADMIN_SETTINGS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
