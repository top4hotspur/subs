export const WEBSITE_TEMPLATE_SLUGS = [
  "taxi",
  "barbers",
  "hairdressers",
  "beauticians",
  "nail-salon",
  "massage",
  "window-cleaning",
  "dog-grooming",
  "driving-instructors",
  "mobile-valeting",
  "cleaners",
  "gardeners",
] as const;

export type WebsiteTemplateSlug = (typeof WEBSITE_TEMPLATE_SLUGS)[number];

export type DemoSiteService = {
  id: string;
  name: string;
  priceLabel?: string;
  description?: string;
};

export type DemoSiteOpeningHours = {
  summary: string;
};

export type DemoSiteContactDetails = {
  phone: string;
  email: string;
  address: string;
};

export type PricingModel = {
  setupFeeLabel: string;
  monthlyFeeLabel: string;
  notes?: string;
};

export type WebsiteSubscriptionOffer = {
  setupFeeGbp: number;
  monthlyFeeGbp: number;
  domainRegistrationFeeGbp: number;
  whatsappAddonMonthlyFeeGbp: number;
  emailIncluded: boolean;
  fullFeatureSetIncluded: boolean;
  summary: string;
  includedFeatures: string[];
};

export enum DomainOption {
  EXISTING_DOMAIN = "EXISTING_DOMAIN",
  CUSTOMER_BUYS_DOMAIN = "CUSTOMER_BUYS_DOMAIN",
  WE_REGISTER_DOMAIN = "WE_REGISTER_DOMAIN",
}

export enum CommunicationOption {
  EMAIL_ONLY = "EMAIL_ONLY",
  EMAIL_AND_WHATSAPP = "EMAIL_AND_WHATSAPP",
}

export type SetupRequestDraft = {
  templateSlug: WebsiteTemplateSlug;
  domainOption: DomainOption;
  communicationOption: CommunicationOption;
  existingDomain?: string;
  desiredDomain?: string;
  businessName: string;
  demoDraftId?: string;
  demoDraftName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export enum SubscriptionSetupStatus {
  DRAFT_DEMO = "DRAFT_DEMO",
  SETUP_REVIEW_REQUESTED = "SETUP_REVIEW_REQUESTED",
  DOMAIN_DETAILS_REQUIRED = "DOMAIN_DETAILS_REQUIRED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  SITE_PROVISIONING = "SITE_PROVISIONING",
  SITE_LIVE = "SITE_LIVE",
  CHANGE_REQUESTED = "CHANGE_REQUESTED",
  CANCELLED = "CANCELLED",
}

export type LocalSetupRequest = SetupRequestDraft & {
  id: string;
  createdAtIso: string;
  status: SubscriptionSetupStatus;
  setupTotalGbp: number;
  monthlyTotalGbp: number;
};

export enum CustomerPortalRequestType {
  BILLING = "BILLING",
  WEBSITE_CHANGE = "WEBSITE_CHANGE",
  DOMAIN = "DOMAIN",
  TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT",
  CANCELLATION = "CANCELLATION",
}

export type DemoSiteConfig = {
  businessName: string;
  primaryColor: string;
  accentColor: string;
  heroHeadline: string;
  heroSubheading: string;
  ctaLabel: string;
  services: DemoSiteService[];
  openingHours: DemoSiteOpeningHours;
  contact: DemoSiteContactDetails;
};

export type DemoCustomisationDraft = {
  id: string;
  draftName: string;
  templateSlug: WebsiteTemplateSlug;
  createdAtIso: string;
  updatedAtIso: string;
  config: DemoSiteConfig;
};

export type DemoCustomisationField =
  | "businessName"
  | "primaryColor"
  | "accentColor"
  | "phone"
  | "email"
  | "address"
  | "heroHeadline"
  | "heroSubheading"
  | "ctaLabel"
  | "services"
  | "openingHours";

export type WebsiteTemplate = {
  slug: WebsiteTemplateSlug;
  name: string;
  category: string;
  marketingSummary: string;
  featureBullets: string[];
  pricing: PricingModel;
  demoLogin: {
    email: string;
    password: string;
  };
  defaultConfig: DemoSiteConfig;
};

export function isWebsiteTemplateSlug(value: string): value is WebsiteTemplateSlug {
  return (WEBSITE_TEMPLATE_SLUGS as readonly string[]).includes(value);
}
