import { z } from "zod";

const cuidString = z.string().cuid();
const optionalText = z.string().trim().min(1).optional();
const nullableText = z.string().trim().min(1).optional().nullable();

export const salesLeadImportRowStatusSchema = z.enum([
  "PENDING_REVIEW",
  "APPROVED",
  "SKIPPED",
  "NEEDS_ENRICHMENT",
  "DUPLICATE",
]);

export const salesLeadImportEmailStatusSchema = z.enum([
  "Missing email",
  "Website found",
  "Email found",
  "Needs manual research",
  "No Email Available",
  "Do not contact",
]);

export const createSalesLeadImportBatchSchema = z.object({
  sourceUrls: z.array(z.string().trim().min(1)).min(1).max(250),
  sourceType: z.enum(["Booksy", "Google Maps", "Facebook", "Manual", "Other"]).optional(),
  defaultIndustrySlug: optionalText,
  defaultCityTown: optionalText,
});

export const updateSalesLeadImportRowSchema = z
  .object({
    id: cuidString,
    extractedBusinessName: nullableText,
    extractedAddress: nullableText,
    extractedPostcode: nullableText,
    extractedPhone: nullableText,
    extractedWebsite: nullableText,
    extractedEmail: z.string().email().optional().nullable(),
    leadSource: nullableText,
    currentProvider: nullableText,
    estimatedCurrentMonthlyCost: z.number().nonnegative().optional().nullable(),
    industrySlug: nullableText,
    cityTown: nullableText,
    status: salesLeadImportRowStatusSchema.optional(),
    emailEnrichmentStatus: salesLeadImportEmailStatusSchema.optional(),
    duplicateReason: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== "id"), {
    message: "At least one field must be updated",
  });

export const approveSalesLeadImportRowsSchema = z.object({
  rowIds: z.array(cuidString).min(1).max(250),
  approveDuplicates: z.boolean().optional().default(false),
});

export const importBatchIdSchema = cuidString;
export const importRowIdSchema = cuidString;
