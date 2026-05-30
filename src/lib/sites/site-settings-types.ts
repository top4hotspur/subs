import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { SiteColourSchemeId } from "@/lib/sites/site-colour-schemes";
import { SiteVisualTemplateId } from "@/lib/sites/site-visual-templates";

export type SiteVisibilityItem = {
  enabled: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  title: string;
};

export type SiteSectionVisibilityItem = {
  enabled: boolean;
  title?: string;
};

export type SiteBrandingSettings = {
  siteName: string;
  heroHeadline?: string;
  heroSubheading?: string;
  visualTemplateId: SiteVisualTemplateId;
  colourSchemeId: SiteColourSchemeId;
  logoUrl?: string;
  logoAlt?: string;
  useTextLogoFallback: boolean;
  primaryColor: string;
  accentColor: string;
  heroImageUrl?: string;
  faviconUrl?: string;
};

export type SiteBusinessDetails = {
  businessName: string;
  tradingName?: string;
  legalName?: string;
  companyNumber?: string;
  vatNumber?: string;
  phone: string;
  email: string;
  address?: string;
  showAddress: boolean;
  serviceAreas: string[];
  showServiceAreas: boolean;
  openingHours: string;
  emergencyOrOutOfHoursNote?: string;
  socialLinks?: Record<string, string>;
  reviewLink?: string;
  googleMapsUrl?: string;
};

export type SitePageVisibilitySettings = {
  home: SiteVisibilityItem;
  services: SiteVisibilityItem;
  about: SiteVisibilityItem;
  contact: SiteVisibilityItem;
  reviews: SiteVisibilityItem;
  gallery: SiteVisibilityItem;
  faq: SiteVisibilityItem;
  terms: SiteVisibilityItem;
  privacy: SiteVisibilityItem;
  cookies: SiteVisibilityItem;
  bookingOrQuote: SiteVisibilityItem;
  policy: SiteVisibilityItem;
  customerLogin: SiteVisibilityItem;
  businessLogin: SiteVisibilityItem;
};

export type SiteAboutPageMode = "GENERAL" | "STAFF_PROFILES";
export type SitePageImagePlacement =
  | "NONE"
  | "ABOVE_TEXT"
  | "BESIDE_TEXT"
  | "BELOW_TEXT";

export type SiteSectionVisibilitySettings = {
  hero: SiteSectionVisibilityItem;
  servicesOverview: SiteSectionVisibilityItem;
  howItWorks: SiteSectionVisibilityItem;
  whyChooseUs: SiteSectionVisibilityItem;
  reviews: SiteSectionVisibilityItem;
  gallery: SiteSectionVisibilityItem;
  serviceAreas: SiteSectionVisibilityItem;
  openingHours: SiteSectionVisibilityItem;
  faq: SiteSectionVisibilityItem;
  contactCta: SiteSectionVisibilityItem;
  bookingCta: SiteSectionVisibilityItem;
  trustBadges: SiteSectionVisibilityItem;
};

export type SitePageContentBlock = {
  title: string;
  body: string;
  imagePlacement: SitePageImagePlacement;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type SiteStaffProfileContentBlock = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
};

export type SitePageContentSettings = {
  about: SitePageContentBlock & {
    mode: SiteAboutPageMode;
    imageUrlSecondary?: string;
    staffProfiles: SiteStaffProfileContentBlock[];
  };
  contact: SitePageContentBlock & {
    contactDetailsText?: string;
    mapPlaceholderText?: string;
    showGoogleMapsLinkFromAddress?: boolean;
  };
  policy: SitePageContentBlock;
};

export type SiteServiceItem = {
  id: string;
  name: string;
  description: string;
  basePriceGbp?: number;
  priceLabel?: string;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  rolePriceOverrides?: {
    roleId?: string;
    roleLabel: string;
    priceGbp: number;
  }[];
  recurringEnabled?: boolean;
  recurringIntervals?: ("WEEKLY" | "MONTHLY" | "ANNUALLY")[];
  blockBookingEnabled?: boolean;
  blockBookingSuggestedCounts?: number[];
  staffPriceOverrides?: {
    staffId: string;
    staffName: string;
    priceGbp: number;
  }[];
  category?: string;
  bookable: boolean;
  requiresQuote: boolean;
  active: boolean;
};

export type SiteLegalSettings = {
  termsEnabled: boolean;
  privacyEnabled: boolean;
  cookiesEnabled: boolean;
  cancellationPolicy?: string;
  refundPolicy?: string;
  termsText?: string;
  privacyText?: string;
  cookiesText?: string;
};

export type SiteNotificationSettings = {
  emailNotificationsEnabled: boolean;
  whatsappAddonEnabled: boolean;
  customerConfirmationEnabled: boolean;
  adminNotificationEmail: string;
  bookingReminderEnabled: boolean;
  completionMessageEnabled: boolean;
  reviewRequestEnabled: boolean;
};

export type SiteSeoSettings = {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImageUrl?: string;
};

export type SiteAnalyticsSettings = {
  analyticsEnabled: boolean;
  showAdminAnalytics: boolean;
  trackPageViews: boolean;
  trackEnquiryConversions: boolean;
  trackBookingConversions: boolean;
};

export type SiteCurrencyCode = "GBP" | "EUR" | "USD";

export type SitePaymentSettings = {
  paymentProcessorSetupMode:
    | "EXISTING_PROCESSOR"
    | "NEED_HELP_SETUP"
    | "MANUAL_RECORDING_ONLY";
  processorProvider?:
    | "STRIPE"
    | "SQUARE"
    | "SUMUP"
    | "PAYPAL"
    | "WORLDPAY"
    | "ZETTLE"
    | "OTHER";
  existingProcessorName?: string;
  merchantReference?: string;
  processorSetupNotes?: string;
  cardPaymentsEnabled: boolean;
  cashPaymentsEnabled: boolean;
  requirePrepaymentForBookings: boolean;
  cashNoShowWarningEnabled: boolean;
  currencyCode: SiteCurrencyCode;
  allowInStorePaymentRecording: boolean;
  recurringPaymentsEnabled?: boolean;
};

export type SiteAppointmentSettings = {
  appointmentSlotIntervalMinutes: 15 | 30 | 60;
  allowCustomerStaffSelection: boolean;
  customerBlockBookingsEnabled?: boolean;
};

export type SiteCancellationPolicySettings = {
  cancellationWindowHours: number;
  fullRefundBeforeWindow: boolean;
  noRefundWithinWindow: boolean;
  policyText?: string;
};

export type SitePolicySettings = {
  cancellationEnabled: boolean;
  fullRefundNoticeDays: 1 | 2 | 3 | 4 | 5;
  noRefundWithinDays: 0 | 1 | 2 | 3 | 4 | 5;
  customPolicyNote?: string;
};

export type CustomerSiteSettings = {
  id: string;
  templateSlug: WebsiteTemplateSlug;
  branding: SiteBrandingSettings;
  businessDetails: SiteBusinessDetails;
  pageVisibility: SitePageVisibilitySettings;
  pageContent: SitePageContentSettings;
  sectionVisibility: SiteSectionVisibilitySettings;
  services: SiteServiceItem[];
  legal: SiteLegalSettings;
  notifications: SiteNotificationSettings;
  paymentSettings: SitePaymentSettings;
  appointmentSettings: SiteAppointmentSettings;
  cancellationPolicy: SiteCancellationPolicySettings;
  policySettings: SitePolicySettings;
  seo: SiteSeoSettings;
  analytics: SiteAnalyticsSettings;
  createdAtIso: string;
  updatedAtIso: string;
};



