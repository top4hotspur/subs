import { z } from "zod";

export const customerAccountRegisterSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(5).max(40),
  accessCode: z.string().trim().min(6).max(80),
  marketingOptIn: z.boolean().optional().default(false),
});

export const customerAccountLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  accessCode: z.string().trim().min(6).max(80),
  callbackUrl: z.string().trim().max(500).optional(),
});

export const customerMarketingPreferenceSchema = z.object({
  marketingOptIn: z.boolean(),
});
