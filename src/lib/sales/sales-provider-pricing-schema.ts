import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const createSalesProviderPricingSchema = z.object({
  providerKey: nonEmpty.max(80),
  providerName: nonEmpty.max(120),
  estimatedMonthlyGbp: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateSalesProviderPricingSchema = z.object({
  id: z.string().cuid(),
  providerName: nonEmpty.max(120).optional(),
  estimatedMonthlyGbp: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
});
