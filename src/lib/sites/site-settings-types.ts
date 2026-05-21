import { WebsiteTemplateSlug } from "@/lib/sites/types";

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
  customerLogin: SiteVisibilityItem;
  businessLogin: SiteVisibilityItem;
};

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

export type SitePaymentSettings = {
  cardPaymentsEnabled: boolean;
  cashPaymentsEnabled: boolean;
  requirePrepaymentForBookings: boolean;
  cashNoShowWarningEnabled: boolean;
};

export type SiteCancellationPolicySettings = {
  cancellationWindowHours: number;
  fullRefundBeforeWindow: boolean;
  noRefundWithinWindow: boolean;
  policyText?: string;
};

export type CustomerSiteSettings = {
  id: string;
  templateSlug: WebsiteTemplateSlug;
  branding: SiteBrandingSettings;
  businessDetails: SiteBusinessDetails;
  pageVisibility: SitePageVisibilitySettings;
  sectionVisibility: SiteSectionVisibilitySettings;
  services: SiteServiceItem[];
  legal: SiteLegalSettings;
  notifications: SiteNotificationSettings;
  paymentSettings: SitePaymentSettings;
  cancellationPolicy: SiteCancellationPolicySettings;
  seo: SiteSeoSettings;
  analytics: SiteAnalyticsSettings;
  createdAtIso: string;
  updatedAtIso: string;
};
