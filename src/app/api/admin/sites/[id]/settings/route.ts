import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";
import {
  getCustomerSiteSettings,
  upsertCustomerSiteSettings,
} from "@/lib/sites/customer-site-settings-repository";
import { upsertCustomerSiteSettingsSchema } from "@/lib/sites/customer-site-settings-schema";
import { getTenantSiteById } from "@/lib/sites/site-provisioning-repository";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(
  _request: NextRequest,
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

    const settings = await getCustomerSiteSettings(id);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SITE_SETTINGS_GET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const parsed = upsertCustomerSiteSettingsSchema.parse({
      tenantSiteId: id,
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

    const settings = await upsertCustomerSiteSettings(id, {
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
        error: "SITE_SETTINGS_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
