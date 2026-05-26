import { z } from "zod";

export const contactEnquiryStatusSchema = z.enum([
  "NEW",
  "REVIEWED",
  "REPLIED",
  "CLOSED",
]);

const optionalTrimmed = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : undefined));

export const createContactEnquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  businessName: optionalTrimmed,
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => (value ? value : undefined)),
  industrySlug: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((value) => (value ? value : undefined)),
  message: z.string().trim().min(1, "Message is required").max(2000),
  source: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const listContactEnquiriesSchema = z.object({
  status: contactEnquiryStatusSchema.optional(),
  email: z.string().trim().email().optional(),
  industrySlug: z.string().trim().max(64).optional(),
  take: z.number().int().min(1).max(200).optional().default(100),
  skip: z.number().int().min(0).optional().default(0),
});

export const updateContactEnquiryStatusSchema = z.object({
  id: z.string().cuid(),
  status: contactEnquiryStatusSchema,
});

