import { buildDefaultCustomerSiteSettings, getDemoServiceDefault } from "@/lib/sites/default-site-settings";
import {
  getSiteColourSchemesForTheme,
  normalizeSiteColourSchemeId,
} from "@/lib/sites/site-colour-schemes";
import { CustomerSiteSettings, SiteServiceItem } from "@/lib/sites/site-settings-types";
import { normalizeSiteVisualTemplateId } from "@/lib/sites/site-visual-templates";
import { mapAppearanceToTheme, normalizeSiteAppearance } from "@/lib/sites/site-appearance";
import { WebsiteTemplate, WebsiteTemplateSlug } from "@/lib/sites/types";

// Temporary browser-only localStorage persistence for customer site settings.
// This is intentionally local/mock and should move to DB + API later.
function siteSettingsKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-site-settings:${industrySlug}`;
}

export function getLocalCustomerSiteSettingsStorageKey(
  industrySlug: WebsiteTemplateSlug,
): string {
  return siteSettingsKey(industrySlug);
}

function normalizeSettings(settings: CustomerSiteSettings): CustomerSiteSettings {
  const templateSlug = settings.templateSlug;
  const sourceThemeId = normalizeSiteVisualTemplateId(
    settings.branding?.visualTemplateId,
  );
  const sourcePaletteId = normalizeSiteColourSchemeId(
    settings.branding?.colourSchemeId,
  );
  const normalizedAppearance = normalizeSiteAppearance(sourceThemeId, sourcePaletteId);
  const mappedAppearance = mapAppearanceToTheme(normalizedAppearance);
  const normalizedThemeId = mappedAppearance.visualThemeId;
  const normalizedPaletteId = mappedAppearance.colourPaletteId;
  const allowedPalettes = getSiteColourSchemesForTheme(normalizedThemeId);
  const paletteForTheme = allowedPalettes[0]?.id ?? normalizedPaletteId;

  return {
    ...settings,
    branding: {
      ...settings.branding,
      visualTemplateId: normalizedThemeId,
      colourSchemeId: paletteForTheme,
      heroHeadline: settings.branding?.heroHeadline ?? settings.branding?.siteName ?? "",
      heroSubheading: settings.branding?.heroSubheading ?? "",
    },
    paymentSettings: {
      paymentProcessorSetupMode:
        settings.paymentSettings?.paymentProcessorSetupMode ??
        "MANUAL_RECORDING_ONLY",
      processorProvider: settings.paymentSettings?.processorProvider,
      existingProcessorName:
        settings.paymentSettings?.existingProcessorName ?? "",
      merchantReference: settings.paymentSettings?.merchantReference ?? "",
      processorSetupNotes: settings.paymentSettings?.processorSetupNotes ?? "",
      cardPaymentsEnabled: settings.paymentSettings?.cardPaymentsEnabled ?? true,
      cashPaymentsEnabled: settings.paymentSettings?.cashPaymentsEnabled ?? false,
      requirePrepaymentForBookings: settings.paymentSettings?.requirePrepaymentForBookings ?? true,
      cashNoShowWarningEnabled: settings.paymentSettings?.cashNoShowWarningEnabled ?? true,
      currencyCode: settings.paymentSettings?.currencyCode ?? "GBP",
      allowInStorePaymentRecording: settings.paymentSettings?.allowInStorePaymentRecording ?? false,
    },
    appointmentSettings: {
      appointmentSlotIntervalMinutes:
        settings.appointmentSettings?.appointmentSlotIntervalMinutes ?? 30,
      allowCustomerStaffSelection:
        settings.appointmentSettings?.allowCustomerStaffSelection ?? true,
    },
    policySettings: {
      cancellationEnabled: settings.policySettings?.cancellationEnabled ?? true,
      fullRefundNoticeDays: settings.policySettings?.fullRefundNoticeDays ?? 2,
      noRefundWithinDays: settings.policySettings?.noRefundWithinDays ?? 1,
      customPolicyNote: settings.policySettings?.customPolicyNote ?? "",
    },
    businessDetails: {
      ...settings.businessDetails,
      socialLinks: settings.businessDetails?.socialLinks ?? {},
    },
    services: settings.services.map((service) => {
      const defaults = getDemoServiceDefault(templateSlug, service.id);
      if (!defaults) return service;
      const requiresQuote = service.requiresQuote || defaults.requiresQuote === true;
      return {
        ...service,
        description: service.description || defaults.description || `Professional ${service.name.toLowerCase()} service.`,
        basePriceGbp: requiresQuote ? undefined : service.basePriceGbp ?? defaults.basePriceGbp,
        durationMinutes: service.durationMinutes ?? defaults.durationMinutes,
        priceLabel: requiresQuote ? "Quote required" : service.priceLabel,
        requiresQuote,
      };
    }),
    pageVisibility: {
      ...settings.pageVisibility,
      contact: {
        ...(settings.pageVisibility?.contact ?? {
          title: "Contact",
          enabled: true,
          showInHeader: true,
          showInFooter: true,
        }),
        enabled: true,
      },
      policy: settings.pageVisibility?.policy ?? {
        title: "Policy",
        enabled: true,
        showInHeader: true,
        showInFooter: true,
      },
    },
    pageContent: {
      about: {
        mode: settings.pageContent?.about?.mode ?? "GENERAL",
        title:
          settings.pageContent?.about?.title ||
          `About ${settings.businessDetails.businessName || settings.branding.siteName}`,
        body:
          settings.pageContent?.about?.body ||
          "Share your story, experience, and what customers can expect when they book with you.",
        imagePlacement: settings.pageContent?.about?.imagePlacement ?? "ABOVE_TEXT",
        imageUrl: settings.pageContent?.about?.imageUrl,
        imageUrlSecondary: settings.pageContent?.about?.imageUrlSecondary,
        staffProfiles:
          settings.pageContent?.about?.staffProfiles?.length > 0
            ? settings.pageContent.about.staffProfiles
            : [
                {
                  id: "profile-1",
                  name: "Team member one",
                  role: "Lead specialist",
                  bio: "Short profile intro about experience and customer care.",
                  imageUrl: "",
                },
                {
                  id: "profile-2",
                  name: "Team member two",
                  role: "Senior specialist",
                  bio: "Short profile intro about strengths and preferred services.",
                  imageUrl: "",
                },
              ],
        ctaLabel: settings.pageContent?.about?.ctaLabel ?? "Book now",
        ctaHref: settings.pageContent?.about?.ctaHref ?? `/demo/${templateSlug}/booking`,
      },
      contact: {
        title: settings.pageContent?.contact?.title || "Contact us",
        body:
          settings.pageContent?.contact?.body ||
          "Get in touch by phone, email, or online booking request.",
        imagePlacement: settings.pageContent?.contact?.imagePlacement ?? "NONE",
        imageUrl: settings.pageContent?.contact?.imageUrl,
        ctaLabel: settings.pageContent?.contact?.ctaLabel ?? "Send booking request",
        ctaHref: settings.pageContent?.contact?.ctaHref ?? `/demo/${templateSlug}/booking`,
        contactDetailsText:
          settings.pageContent?.contact?.contactDetailsText ||
          "Use your business profile details below, or add custom contact notes.",
        mapPlaceholderText:
          settings.pageContent?.contact?.mapPlaceholderText ||
          "Map or directions content can be added here.",
        showGoogleMapsLinkFromAddress:
          settings.pageContent?.contact?.showGoogleMapsLinkFromAddress ?? true,
      },
      policy: {
        title:
          settings.pageContent?.policy?.title ||
          `${settings.businessDetails.businessName || settings.branding.siteName} policy`,
        body:
          settings.pageContent?.policy?.body ||
          "Read our policy details before confirming a booking.",
        imagePlacement: "NONE",
        imageUrl: undefined,
        ctaLabel: settings.pageContent?.policy?.ctaLabel,
        ctaHref: settings.pageContent?.policy?.ctaHref,
      },
    },
  };
}

function readSettings(industrySlug: WebsiteTemplateSlug): CustomerSiteSettings | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(siteSettingsKey(industrySlug));
  if (!raw) {
    return null;
  }

  try {
    return normalizeSettings(JSON.parse(raw) as CustomerSiteSettings);
  } catch {
    return null;
  }
}

export function saveLocalCustomerSiteSettings(settings: CustomerSiteSettings): CustomerSiteSettings {
  if (typeof window === "undefined") {
    return settings;
  }

  const updated: CustomerSiteSettings = {
    ...settings,
    updatedAtIso: new Date().toISOString(),
  };
  window.localStorage.setItem(siteSettingsKey(settings.templateSlug), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("subs:site-settings-updated"));
  return updated;
}

export function getLocalCustomerSiteSettings(
  industrySlug: WebsiteTemplateSlug,
  template: WebsiteTemplate,
): CustomerSiteSettings {
  const existing = readSettings(industrySlug);
  if (existing) {
    return existing;
  }

  const defaults = buildDefaultCustomerSiteSettings(template);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(siteSettingsKey(industrySlug), JSON.stringify(defaults));
  }
  return normalizeSettings(defaults);
}

export function resetLocalCustomerSiteSettings(
  industrySlug: WebsiteTemplateSlug,
  template: WebsiteTemplate,
): CustomerSiteSettings {
  const defaults = buildDefaultCustomerSiteSettings(template);
  const reset: CustomerSiteSettings = {
    ...defaults,
    templateSlug: industrySlug,
    id: `site-settings-${industrySlug}`,
    updatedAtIso: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(siteSettingsKey(industrySlug), JSON.stringify(reset));
  }
  return normalizeSettings(reset);
}

export function updateLocalSiteServices(
  industrySlug: WebsiteTemplateSlug,
  template: WebsiteTemplate,
  services: SiteServiceItem[],
): CustomerSiteSettings {
  const current = getLocalCustomerSiteSettings(industrySlug, template);
  return saveLocalCustomerSiteSettings({
    ...current,
    services,
  });
}

export function seedLocalCustomerSiteSettings(
  industrySlug: WebsiteTemplateSlug,
  template: WebsiteTemplate,
): CustomerSiteSettings {
  const existing = readSettings(industrySlug);
  if (existing) {
    return existing;
  }
  return getLocalCustomerSiteSettings(industrySlug, template);
}
