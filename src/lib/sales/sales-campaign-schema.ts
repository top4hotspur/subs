import { z } from "zod";

const cuidString = z.string().cuid();
const optionalText = z.string().trim().min(1).optional();

export const campaignLevelSchema = z.enum(["LAUNCH_OFFER", "INTRODUCTION", "REMINDER"]);
export const campaignStatusSchema = z.enum(["DRAFT", "PREPARED", "SENT", "ARCHIVED"]);

export const createSalesCampaignSchema = z.object({
  name: z.string().trim().min(1),
  industrySlug: optionalText,
  serviceArea: optionalText,
  campaignLevel: campaignLevelSchema,
  status: campaignStatusSchema.default("DRAFT"),
});

export const updateSalesCampaignSchema = z.object({
  id: cuidString,
  name: z.string().trim().min(1).optional(),
  industrySlug: optionalText,
  serviceArea: optionalText,
  campaignLevel: campaignLevelSchema.optional(),
  status: campaignStatusSchema.optional(),
});

export const listSalesCampaignsSchema = z.object({
  industrySlug: optionalText,
  serviceArea: optionalText,
  campaignLevel: campaignLevelSchema.optional(),
  status: campaignStatusSchema.optional(),
  take: z.number().int().min(1).max(200).optional().default(50),
});
