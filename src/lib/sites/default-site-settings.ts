import { CustomerSiteSettings, SitePageVisibilitySettings, SiteSectionVisibilitySettings } from "@/lib/sites/site-settings-types";
import { WebsiteTemplate } from "@/lib/sites/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pageItem(title: string, enabled: boolean, showInHeader: boolean, showInFooter: boolean) {
  return { title, enabled, showInHeader, showInFooter };
}

function defaultPageVisibility(): SitePageVisibilitySettings {
  return {
    home: pageItem("Home", true, true, true),
    services: pageItem("Services", true, true, true),
    about: pageItem("About", true, true, true),
    contact: pageItem("Contact", true, true, true),
    reviews: pageItem("Reviews", true, true, true),
    gallery: pageItem("Gallery", false, true, true),
    faq: pageItem("FAQ", true, true, true),
    terms: pageItem("Terms", true, false, true),
    privacy: pageItem("Privacy", true, false, true),
    cookies: pageItem("Cookies", true, false, true),
    bookingOrQuote: pageItem("Book / Request Quote", true, true, true),
    customerLogin: pageItem("Customer Login", false, false, true),
    businessLogin: pageItem("Business Login", false, false, true),
  };
}

function defaultSectionVisibility(): SiteSectionVisibilitySettings {
  return {
    hero: { enabled: true, title: "Hero" },
    servicesOverview: { enabled: true, title: "Services Overview" },
    howItWorks: { enabled: true, title: "How It Works" },
    whyChooseUs: { enabled: true, title: "Why Choose Us" },
    reviews: { enabled: true, title: "Reviews" },
    gallery: { enabled: false, title: "Gallery" },
    serviceAreas: { enabled: true, title: "Service Areas" },
    openingHours: { enabled: true, title: "Opening Hours" },
    faq: { enabled: true, title: "FAQ" },
    contactCta: { enabled: true, title: "Contact CTA" },
    bookingCta: { enabled: true, title: "Booking / Quote CTA" },
    trustBadges: { enabled: true, title: "Trust Badges" },
  };
}

export function buildDefaultCustomerSiteSettings(template: WebsiteTemplate): CustomerSiteSettings {
  const now = new Date().toISOString();
  const domainSlug = slugify(template.defaultConfig.businessName || template.slug);

  return {
    id: `site-settings-${template.slug}`,
    templateSlug: template.slug,
    branding: {
      siteName: template.defaultConfig.businessName,
      useTextLogoFallback: true,
      primaryColor: template.defaultConfig.primaryColor,
      accentColor: template.defaultConfig.accentColor,
      heroImageUrl: undefined,
      faviconUrl: undefined,
      logoUrl: undefined,
      logoAlt: `${template.defaultConfig.businessName} logo`,
    },
    businessDetails: {
      businessName: template.defaultConfig.businessName,
      phone: template.defaultConfig.contact.phone,
      email: template.defaultConfig.contact.email,
      address: template.defaultConfig.contact.address,
      showAddress: true,
      serviceAreas: ["Local area coverage", "Surrounding towns"],
      showServiceAreas: true,
      openingHours: template.defaultConfig.openingHours.summary,
      reviewLink: undefined,
      googleMapsUrl: undefined,
      socialLinks: {},
    },
    pageVisibility: defaultPageVisibility(),
    sectionVisibility: defaultSectionVisibility(),
    services: template.defaultConfig.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? `Professional ${service.name.toLowerCase()} service.`,
      basePriceGbp: undefined,
      priceLabel: service.priceLabel,
      durationMinutes: undefined,
      bufferBeforeMinutes: undefined,
      bufferAfterMinutes: undefined,
      rolePriceOverrides: [],
      staffPriceOverrides: [],
      category: template.category,
      bookable: true,
      requiresQuote: /quote|consultation/i.test(template.defaultConfig.ctaLabel),
      active: true,
    })),
    legal: {
      termsEnabled: true,
      privacyEnabled: true,
      cookiesEnabled: true,
      cancellationPolicy: "Configured during setup.",
      refundPolicy: "Configured during setup.",
    },
    notifications: {
      emailNotificationsEnabled: true,
      whatsappAddonEnabled: false,
      customerConfirmationEnabled: true,
      adminNotificationEmail: template.defaultConfig.contact.email,
      bookingReminderEnabled: true,
      completionMessageEnabled: true,
      reviewRequestEnabled: true,
    },
    paymentSettings: {
      cardPaymentsEnabled: true,
      cashPaymentsEnabled: false,
      requirePrepaymentForBookings: true,
      cashNoShowWarningEnabled: true,
      currencyCode: "GBP",
      allowInStorePaymentRecording: false,
    },
    cancellationPolicy: {
      cancellationWindowHours: 24,
      fullRefundBeforeWindow: true,
      noRefundWithinWindow: true,
      policyText:
        "Bookings can be cancelled up to 24 hours in advance for a full refund. No refund is available after this notice period.",
    },
    seo: {
      title: `${template.defaultConfig.businessName} | ${template.category}`,
      description: template.marketingSummary,
      keywords: [template.slug, template.category.toLowerCase(), "local service website", "managed website"],
      canonicalUrl: `https://www.myexperiment.club/${domainSlug}`,
    },
    analytics: {
      analyticsEnabled: true,
      showAdminAnalytics: true,
      trackPageViews: true,
      trackEnquiryConversions: true,
      trackBookingConversions: true,
    },
    createdAtIso: now,
    updatedAtIso: now,
  };
}
