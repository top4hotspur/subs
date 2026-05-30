import { z } from "zod";

const cuidString = z.string().cuid();
const nonEmpty = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).optional();
const isoDateString = z.string().datetime({ offset: true });
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const leadStatuses = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SENT",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "DO_NOT_CONTACT",
] as const;
const countries = ["England", "Scotland", "Wales", "Northern Ireland"] as const;
const marketingStatuses = ["ACTIVE", "DO_NOT_CONTACT", "UNSUBSCRIBED", "BOUNCED"] as const;

export const salesLeadStatusSchema = z.enum(leadStatuses);
export const salesLeadCountrySchema = z.enum(countries);
export const salesLeadMarketingStatusSchema = z.enum(marketingStatuses);

export const createSalesLeadSchema = z.object({
  businessName: nonEmpty,
  location: optionalText,
  country: salesLeadCountrySchema.optional(),
  cityTown: optionalText,
  postcode: optionalText,
  address: optionalText,
  serviceArea: optionalText,
  industrySlug: optionalText,
  industryLabel: optionalText,
  contactName: optionalText,
  email: z.string().email().optional(),
  phone: z.string().trim().min(3).optional(),
  leadSource: optionalText,
  sourceUrl: z.string().url().optional(),
  currentProvider: optionalText,
  estimatedCurrentMonthlyCost: z.number().nonnegative().optional(),
  marketingStatus: salesLeadMarketingStatusSchema.default("ACTIVE"),
  unsubscribedAt: isoDateString.optional().nullable(),
  doNotContactReason: z.string().optional(),
  status: salesLeadStatusSchema.default("NEW"),
  source: optionalText,
  notes: z.string().optional(),
  lastContactedAt: isoDateString.optional(),
  lastMarketingEmailAt: isoDateString.optional(),
  emailSentCount: z.number().int().min(0).optional(),
  nextFollowUpAt: dateOnly.optional(),
});

export const updateSalesLeadSchema = z
  .object({
    id: cuidString,
    businessName: nonEmpty.optional(),
    location: optionalText,
    country: salesLeadCountrySchema.optional().nullable(),
    cityTown: optionalText,
    postcode: optionalText,
    address: optionalText,
    serviceArea: optionalText,
    industrySlug: optionalText,
    industryLabel: optionalText,
    contactName: optionalText,
    email: z.string().email().optional(),
    phone: z.string().trim().min(3).optional(),
    leadSource: optionalText,
    sourceUrl: z.string().url().optional().nullable(),
    currentProvider: optionalText,
    estimatedCurrentMonthlyCost: z.number().nonnegative().optional().nullable(),
    marketingStatus: salesLeadMarketingStatusSchema.optional(),
    unsubscribedAt: isoDateString.optional().nullable(),
    doNotContactReason: z.string().optional().nullable(),
    status: salesLeadStatusSchema.optional(),
    source: optionalText,
    notes: z.string().optional(),
    lastContactedAt: isoDateString.optional().nullable(),
    lastMarketingEmailAt: isoDateString.optional().nullable(),
    emailSentCount: z.number().int().min(0).optional(),
    nextFollowUpAt: dateOnly.optional().nullable(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== "id"), {
    message: "At least one field must be updated",
  });

export const listSalesLeadsSchema = z.object({
  search: z.string().trim().optional(),
  status: salesLeadStatusSchema.optional(),
  industrySlug: z.string().trim().optional(),
  location: z.string().trim().optional(),
  country: salesLeadCountrySchema.optional(),
  cityTown: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  serviceArea: z.string().trim().optional(),
  leadSource: z.string().trim().optional(),
  marketingStatus: salesLeadMarketingStatusSchema.optional(),
  take: z.number().int().min(1).max(500).optional().default(200),
  skip: z.number().int().min(0).optional().default(0),
});

export const createSalesLeadEventSchema = z.object({
  salesLeadId: cuidString,
  eventType: nonEmpty,
  message: z.string().optional(),
  metadata: z.unknown().optional(),
});

export const markSalesLeadContactedSchema = z.object({
  id: cuidString,
  message: z.string().optional(),
  status: salesLeadStatusSchema.optional(),
});
