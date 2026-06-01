import { z } from "zod";

export const salesCampaignTemplateKeySchema = z.enum([
  "EMAIL_INTRODUCTION",
  "EMAIL_REMINDER",
  "SNAIL_MAIL_LETTER",
]);

export const salesCampaignTemplateChannelSchema = z.enum(["EMAIL", "LETTER"]);

export const upsertSalesCampaignTemplateSchema = z.object({
  templateKey: salesCampaignTemplateKeySchema,
  channel: salesCampaignTemplateChannelSchema,
  subject: z.string().trim().min(1).max(200).optional().nullable(),
  body: z.string().trim().min(1).max(10000),
});
