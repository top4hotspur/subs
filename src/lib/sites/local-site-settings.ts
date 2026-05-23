import { buildDefaultCustomerSiteSettings } from "@/lib/sites/default-site-settings";
import { CustomerSiteSettings, SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplate, WebsiteTemplateSlug } from "@/lib/sites/types";

// Temporary browser-only localStorage persistence for customer site settings.
// This is intentionally local/mock and should move to DB + API later.
function siteSettingsKey(industrySlug: WebsiteTemplateSlug): string {
  return `subs-site-settings:${industrySlug}`;
}

function normalizeSettings(settings: CustomerSiteSettings): CustomerSiteSettings {
  const templateSlug = settings.templateSlug;
  return {
    ...settings,
    paymentSettings: {
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
    businessDetails: {
      ...settings.businessDetails,
      socialLinks: settings.businessDetails?.socialLinks ?? {},
    },
    pageContent: {
      about: {
        title:
          settings.pageContent?.about?.title ||
          `About ${settings.businessDetails.businessName || settings.branding.siteName}`,
        body:
          settings.pageContent?.about?.body ||
          "Share your story, experience, and what customers can expect when they book with you.",
        imagePlacement: settings.pageContent?.about?.imagePlacement ?? "NONE",
        imageUrl: settings.pageContent?.about?.imageUrl,
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

