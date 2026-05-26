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
});

export const customerSiteServiceInputSchema = z.object({
  id: cuid.optional(),
  name: z.string().trim().min(1).max(140),
  description: z.string().trim().max(600).nullable().optional(),
  basePrice: z.number().finite().min(0).max(100000).nullable().optional(),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  bufferAfterMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  rolePriceOverrides: z.unknown().nullable().optional(),
});

export const replaceCustomerSiteServicesSchema = z.object({
  tenantSiteId: cuid,
  services: z.array(customerSiteServiceInputSchema).max(500),
});

export const tenantSiteIdSchema = z.object({
  tenantSiteId: cuid,
});

export const deleteCustomerSiteServiceSchema = z.object({
  tenantSiteId: cuid,
  serviceId: cuid,
});
