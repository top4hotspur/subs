import { CustomerSiteSettings, SitePageContentSettings, SitePageVisibilitySettings, SiteSectionVisibilitySettings } from "@/lib/sites/site-settings-types";
import { WebsiteTemplate } from "@/lib/sites/types";
import { shouldCustomersSelectStaffByDefault } from "@/lib/staff/industry-staff-defaults";

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
    policy: pageItem("Policy", true, true, true),
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

function defaultPageContent(template: WebsiteTemplate): SitePageContentSettings {
  return {
    about: {
      title: `About ${template.defaultConfig.businessName}`,
      body: "Share your story, experience, and what customers can expect when they book with you.",
      mode: "GENERAL",
      imagePlacement: "ABOVE_TEXT",
      imageUrl: undefined,
      imageUrlSecondary: undefined,
      staffProfiles: [
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
      ctaLabel: "Book now",
      ctaHref: `/demo/${template.slug}/booking`,
    },
    contact: {
      title: "Contact us",
      body: "Get in touch by phone, email, or online booking request.",
      imagePlacement: "NONE",
      imageUrl: undefined,
      ctaLabel: "Send booking request",
      ctaHref: `/demo/${template.slug}/booking`,
      contactDetailsText: "Use your business profile details below, or add custom contact notes.",
      mapPlaceholderText: "Map or directions content can be added here.",
      showGoogleMapsLinkFromAddress: true,
    },
    policy: {
      title: `${template.defaultConfig.businessName} policy`,
      body: "Read our policy details before confirming a booking.",
      imagePlacement: "NONE",
      imageUrl: undefined,
      ctaLabel: undefined,
      ctaHref: undefined,
    },
  };
}

type DemoServiceDefault = {
  basePriceGbp?: number;
  durationMinutes?: number;
  requiresQuote?: boolean;
  description?: string;
  category?: string;
};

const DEMO_SERVICE_DEFAULTS: Record<string, Record<string, DemoServiceDefault>> = {
  taxi: {
    "local-private-hire": { basePriceGbp: 12, durationMinutes: 30, description: "Local pickup and private-hire journeys." },
    "airport-transfers": { basePriceGbp: 45, durationMinutes: 60, description: "Fixed-price airport transfer enquiry." },
    "corporate-tour-operator": { requiresQuote: true, durationMinutes: 60, description: "Account and operator bookings quoted by journey." },
    "golf-transfers": { basePriceGbp: 35, durationMinutes: 45, description: "Golf transfer for players and equipment." },
    "tourist-tours": { requiresQuote: true, durationMinutes: 120, description: "Custom local tour and day-trip route planning." },
    "event-transport": { requiresQuote: true, durationMinutes: 90, description: "Event pickup and drop-off quote." },
  },
  "bus-hire": {
    "private-bus-hire": { requiresQuote: true, durationMinutes: 120, description: "Private group bus hire request." },
    "school-transport": { requiresQuote: true, durationMinutes: 120, description: "School trip and regular transport enquiry." },
    "event-transport": { basePriceGbp: 180, durationMinutes: 180, description: "Event transport package estimate." },
    "airport-group-transfer": { basePriceGbp: 220, durationMinutes: 180, description: "Airport group transfer estimate." },
    "day-trip-transport": { requiresQuote: true, durationMinutes: 240, description: "Day trip transport quoted by route and group size." },
  },
  barbers: {
    "gents-haircut": { basePriceGbp: 18, durationMinutes: 30, description: "Skin fade or classic cut.", category: "Cuts" },
    "student-cut": { basePriceGbp: 16, durationMinutes: 25, description: "Student cut with valid ID.", category: "Cuts" },
    "childrens-cut": { basePriceGbp: 12, durationMinutes: 20, description: "Kids cut for younger clients.", category: "Cuts" },
    "clipper-cut": { basePriceGbp: 14, durationMinutes: 20, description: "Quick clipper cut.", category: "Cuts" },
    "hot-towel-shave": { basePriceGbp: 20, durationMinutes: 30, description: "Traditional hot towel shave.", category: "Shaves" },
    "head-wet-shave": { basePriceGbp: 18, durationMinutes: 25, description: "Head wet shave and finish.", category: "Shaves" },
    "beard-trim-shape": { basePriceGbp: 10, durationMinutes: 15, description: "Beard trim and shaping.", category: "Beard & Grooming" },
    "haircut-beard-trim": { basePriceGbp: 28, durationMinutes: 45, description: "Haircut with beard trim.", category: "Beard & Grooming" },
    "facial-mask-hot-towel": { basePriceGbp: 24, durationMinutes: 30, description: "Face mask and hot towel treatment.", category: "Treatments" },
    "deluxe-package": { requiresQuote: true, durationMinutes: 60, description: "Wedding or group booking package.", category: "Packages" },
  },
  hairdressers: {
    cut: { basePriceGbp: 35, durationMinutes: 45, description: "Wash, cut and blow dry.", category: "Cuts" },
    color: { basePriceGbp: 75, durationMinutes: 120, description: "Full colour and highlights appointment.", category: "Colour" },
    balayage: { basePriceGbp: 95, durationMinutes: 150, description: "Balayage, toning and finish.", category: "Colour" },
    event: { requiresQuote: true, durationMinutes: 90, description: "Bridal and event styling consultation.", category: "Styling" },
  },
  beauticians: {
    "facial-treatment": { basePriceGbp: 45, durationMinutes: 60, description: "Relaxing facial treatment." },
    "brow-shaping": { basePriceGbp: 18, durationMinutes: 20, description: "Brow shape and tidy." },
    "lash-lift": { basePriceGbp: 38, durationMinutes: 50, description: "Lash lift treatment." },
    waxing: { basePriceGbp: 25, durationMinutes: 30, description: "Waxing appointment." },
  },
  "nail-salon": {
    manicure: { basePriceGbp: 25, durationMinutes: 45, description: "Luxury manicure." },
    biab: { basePriceGbp: 35, durationMinutes: 60, description: "BIAB overlay appointment." },
    gel: { basePriceGbp: 28, durationMinutes: 45, description: "Gel polish treatment." },
    art: { requiresQuote: true, durationMinutes: 75, description: "Custom nail art priced by design." },
  },
  massage: {
    "massage-30": { basePriceGbp: 30, durationMinutes: 30, description: "Focused 30-minute massage." },
    "massage-60": { basePriceGbp: 55, durationMinutes: 60, description: "Full 60-minute massage." },
    "deep-tissue": { basePriceGbp: 60, durationMinutes: 60, description: "Deep tissue massage." },
    relaxation: { basePriceGbp: 50, durationMinutes: 60, description: "Relaxation massage." },
  },
  "window-cleaning": {
    "regular-round": { basePriceGbp: 15, durationMinutes: 30, description: "Regular window cleaning round." },
    "one-off-exterior": { basePriceGbp: 35, durationMinutes: 60, description: "One-off exterior window clean." },
    "conservatory-roof": { basePriceGbp: 60, durationMinutes: 90, description: "Conservatory roof clean." },
    "gutter-clearing": { basePriceGbp: 75, durationMinutes: 90, description: "Gutter clearing appointment." },
    "solar-panel-clean": { basePriceGbp: 45, durationMinutes: 60, description: "Solar panel clean." },
    "commercial-window-quote": { requiresQuote: true, durationMinutes: 90, description: "Commercial window cleaning quote." },
  },
  "dog-grooming": {
    "small-groom": { basePriceGbp: 35, durationMinutes: 60, description: "Small dog groom." },
    "large-groom": { basePriceGbp: 60, durationMinutes: 90, description: "Large dog groom." },
    "bath-brush": { basePriceGbp: 45, durationMinutes: 75, description: "Medium dog bath and brush." },
    "nail-trim": { basePriceGbp: 10, durationMinutes: 15, description: "Nail trim." },
  },
  "driving-instructors": {
    manual: { basePriceGbp: 38, durationMinutes: 60, description: "Manual driving lesson." },
    intensive: { basePriceGbp: 350, durationMinutes: 300, description: "Block booking for intensive lessons." },
    mock: { basePriceGbp: 45, durationMinutes: 75, description: "Mock driving test session." },
    refresher: { basePriceGbp: 40, durationMinutes: 60, description: "Refresher driving lesson." },
  },
  tutors: {
    "one-to-one-tutoring": { basePriceGbp: 30, durationMinutes: 60, description: "One-to-one tutoring session." },
    "online-lesson": { basePriceGbp: 25, durationMinutes: 60, description: "Online lesson." },
    "exam-preparation": { basePriceGbp: 35, durationMinutes: 75, description: "Exam preparation lesson." },
    "group-session": { requiresQuote: true, durationMinutes: 90, description: "Group tutoring session." },
  },
  "mobile-valeting": {
    "mini-valet": { basePriceGbp: 35, durationMinutes: 60, description: "Mini valet package." },
    "full-valet": { basePriceGbp: 75, durationMinutes: 120, description: "Full valet package." },
    "interior-clean": { basePriceGbp: 45, durationMinutes: 75, description: "Interior clean." },
    "exterior-wash": { basePriceGbp: 25, durationMinutes: 45, description: "Exterior wash." },
  },
  cleaners: {
    "regular-clean": { basePriceGbp: 25, durationMinutes: 60, description: "Regular domestic clean." },
    "deep-clean": { basePriceGbp: 80, durationMinutes: 180, description: "Deep clean appointment." },
    "end-tenancy": { requiresQuote: true, durationMinutes: 240, description: "End-of-tenancy cleaning quote." },
    "one-off-clean": { basePriceGbp: 60, durationMinutes: 120, description: "One-off clean." },
  },
  gardeners: {
    "lawn-cutting": { basePriceGbp: 25, durationMinutes: 45, description: "Lawn cutting visit." },
    "hedge-trimming": { basePriceGbp: 45, durationMinutes: 75, description: "Hedge trimming." },
    "garden-tidy": { basePriceGbp: 65, durationMinutes: 120, description: "Garden tidy-up." },
    "regular-maintenance": { requiresQuote: true, durationMinutes: 90, description: "Recurring garden maintenance plan." },
  },
};

export function getDemoServiceDefault(templateSlug: string, serviceId: string): DemoServiceDefault | undefined {
  return DEMO_SERVICE_DEFAULTS[templateSlug]?.[serviceId];
}

function enrichDemoService(
  templateSlug: string,
  service: WebsiteTemplate["defaultConfig"]["services"][number],
  category: string,
) {
  const defaults = getDemoServiceDefault(templateSlug, service.id);
  const requiresQuote = defaults?.requiresQuote ?? /quote|required|consultation/i.test(service.priceLabel ?? "");
  return {
    id: service.id,
    name: service.name,
    description: defaults?.description ?? service.description ?? `Professional ${service.name.toLowerCase()} service.`,
    basePriceGbp: requiresQuote ? undefined : defaults?.basePriceGbp,
    priceLabel: requiresQuote ? "Quote required" : service.priceLabel,
    durationMinutes: defaults?.durationMinutes,
    bufferBeforeMinutes: undefined,
    bufferAfterMinutes: undefined,
    rolePriceOverrides: [],
    recurringEnabled: false,
    recurringIntervals: [],
    blockBookingEnabled: false,
    blockBookingSuggestedCounts: [5, 10],
    staffPriceOverrides: [],
    category: defaults?.category ?? category,
    bookable: true,
    requiresQuote,
    active: true,
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
      heroHeadline: template.defaultConfig.heroHeadline,
      heroSubheading: "",
      visualTemplateId: "modern-minimalist",
      colourSchemeId: "slate-teal",
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
    pageContent: defaultPageContent(template),
    sectionVisibility: defaultSectionVisibility(),
    services: template.defaultConfig.services.map((service) => enrichDemoService(template.slug, service, template.category)),
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
      paymentProcessorSetupMode: "MANUAL_RECORDING_ONLY",
      processorProvider: undefined,
      existingProcessorName: "",
      merchantReference: "",
      processorSetupNotes: "",
      cardPaymentsEnabled: true,
      cashPaymentsEnabled: false,
      requirePrepaymentForBookings: true,
      cashNoShowWarningEnabled: true,
      currencyCode: "GBP",
      allowInStorePaymentRecording: false,
      recurringPaymentsEnabled: false,
    },
    appointmentSettings: {
      appointmentSlotIntervalMinutes: 30,
      allowCustomerStaffSelection: shouldCustomersSelectStaffByDefault(template.slug),
      customerBlockBookingsEnabled: false,
    },
    cancellationPolicy: {
      cancellationWindowHours: 24,
      fullRefundBeforeWindow: true,
      noRefundWithinWindow: true,
      policyText:
        "Bookings can be cancelled up to 24 hours in advance for a full refund. No refund is available after this notice period.",
    },
    policySettings: {
      cancellationEnabled: true,
      fullRefundNoticeDays: 2,
      noRefundWithinDays: 1,
      customPolicyNote: "",
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





