import { z } from "zod";

const cuid = z.string().cuid();
const paymentSetupModeEnum = z.enum([
  "EXISTING_PROCESSOR",
  "NEED_HELP_SETUP",
  "MANUAL_RECORDING_ONLY",
]);
const paymentProcessorNameEnum = z.enum([
  "Stripe",
  "Square",
  "SumUp",
  "PayPal",
  "Worldpay",
  "Zettle",
  "Other",
]);
const aboutPageModeEnum = z.enum(["GENERAL", "STAFF_PROFILES"]);
const aboutImagePlacementEnum = z.enum(["ABOVE", "BESIDE", "BELOW"]);

const socialUrlSchema = z
  .string()
  .trim()
  .max(1200)
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => !value || /^https?:\/\//i.test(value), {
    message: "URL must start with http:// or https://",
  });

const socialPlatformLinkSchema = z.object({
  enabled: z.boolean().optional().default(false),
  url: socialUrlSchema,
});

const socialLinksSchema = z
  .object({
    facebook: socialPlatformLinkSchema.optional(),
    instagram: socialPlatformLinkSchema.optional(),
    tiktok: socialPlatformLinkSchema.optional(),
    xTwitter: socialPlatformLinkSchema.optional(),
    linkedin: socialPlatformLinkSchema.optional(),
    youtube: socialPlatformLinkSchema.optional(),
  })
  .strict();

export const upsertCustomerSiteSettingsSchema = z.object({
  tenantSiteId: cuid,
  siteDisplayName: z.string().trim().min(1).max(120).nullable().optional(),
  businessName: z.string().trim().min(1).max(120).nullable().optional(),
  phone: z.string().trim().min(1).max(60).nullable().optional(),
  email: z.string().trim().email().max(160).nullable().optional(),
  address: z.string().trim().min(1).max(320).nullable().optional(),
  openingHoursSummary: z.string().trim().min(1).max(500).nullable().optional(),
  heroHeadline: z.string().trim().min(1).max(200).nullable().optional(),
  heroSubheading: z.string().trim().min(1).max(400).nullable().optional(),
  visualThemeId: z.string().trim().min(1).max(80).nullable().optional(),
  colourPaletteId: z.string().trim().min(1).max(80).nullable().optional(),
  currency: z.enum(["GBP", "EUR", "USD"]).nullable().optional(),
  logoUrl: z.string().trim().url().max(1200).nullable().optional(),
  logoStorageKey: z.string().trim().min(1).max(600).nullable().optional(),
  logoContentType: z.string().trim().min(1).max(120).nullable().optional(),
  logoFileName: z.string().trim().min(1).max(220).nullable().optional(),
  faviconUrl: z.string().trim().url().max(1200).nullable().optional(),
  faviconStorageKey: z.string().trim().min(1).max(600).nullable().optional(),
  faviconContentType: z.string().trim().min(1).max(120).nullable().optional(),
  faviconFileName: z.string().trim().min(1).max(220).nullable().optional(),
  paymentProcessorSetupMode: paymentSetupModeEnum.nullable().optional(),
  paymentProcessorName: paymentProcessorNameEnum.nullable().optional(),
  paymentProcessorAccountRef: z.string().trim().min(1).max(200).nullable().optional(),
  paymentProcessorNotes: z.string().trim().min(1).max(1200).nullable().optional(),
  acceptCashPayments: z.boolean().optional(),
  acceptCardPayments: z.boolean().optional(),
  requireBookingPrepayment: z.boolean().optional(),
  allowInStorePaymentRecording: z.boolean().optional(),
  cancellationFullRefundNoticeDays: z.number().int().min(0).max(14).nullable().optional(),
  cancellationNoRefundWithinDays: z.number().int().min(0).max(14).nullable().optional(),
  cancellationPolicyNote: z.string().trim().min(1).max(1600).nullable().optional(),
  aboutPageEnabled: z.boolean().optional(),
  policyPageEnabled: z.boolean().optional(),
  aboutPageMode: aboutPageModeEnum.nullable().optional(),
  aboutTitle: z.string().trim().min(1).max(180).nullable().optional(),
  aboutBody: z.string().trim().min(1).max(8000).nullable().optional(),
  aboutImageOneUrl: z.string().trim().url().max(1200).nullable().optional(),
  aboutImageTwoUrl: z.string().trim().url().max(1200).nullable().optional(),
  aboutImagePlacement: aboutImagePlacementEnum.nullable().optional(),
  aboutStaffProfilesJson: z.unknown().nullable().optional(),
  contactTitle: z.string().trim().min(1).max(180).nullable().optional(),
  contactIntro: z.string().trim().min(1).max(2000).nullable().optional(),
  contactMapEnabled: z.boolean().optional(),
  contactMapNote: z.string().trim().min(1).max(2000).nullable().optional(),
  policyTitle: z.string().trim().min(1).max(180).nullable().optional(),
  policyIntro: z.string().trim().min(1).max(2000).nullable().optional(),
  policyBody: z.string().trim().min(1).max(8000).nullable().optional(),
  socialLinks: socialLinksSchema.nullable().optional(),
  recurringPaymentsEnabled: z.boolean().optional(),
  customerBlockBookingsEnabled: z.boolean().optional(),
});

export const customerSiteServiceInputSchema = z.object({
  id: cuid.optional(),
  categoryId: cuid.nullable().optional(),
  name: z.string().trim().min(1).max(140),
  description: z.string().trim().max(600).nullable().optional(),
  basePrice: z.number().finite().min(0).max(100000).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  bufferAfterMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  rolePriceOverrides: z.unknown().nullable().optional(),
  recurringEnabled: z.boolean().optional().default(false),
  recurringIntervals: z.array(z.enum(["WEEKLY", "MONTHLY", "ANNUALLY"])).max(1).nullable().optional(),
  blockBookingEnabled: z.boolean().optional().default(false),
  blockBookingSuggestedCounts: z.array(z.number().int().min(2).max(52)).max(8).nullable().optional(),
});

export const customerSiteServiceCategoryInputSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const replaceCustomerSiteServicesSchema = z.object({
  tenantSiteId: cuid,
  categories: z.array(customerSiteServiceCategoryInputSchema).max(100).optional().default([]),
  services: z.array(customerSiteServiceInputSchema).max(500),
});

export const tenantSiteIdSchema = z.object({
  tenantSiteId: cuid,
});

export const deleteCustomerSiteServiceSchema = z.object({
  tenantSiteId: cuid,
  serviceId: cuid,
});
