import { z } from "zod";

export const createSetupRequestSchema = z.object({
  tenantSiteId: z.string().cuid().optional(),
  demoDraftSnapshotId: z.string().cuid().optional(),
  industrySlug: z.string().min(1),
  businessName: z.string().min(1),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  domainOption: z.string().min(1),
  existingDomain: z.string().min(1).optional(),
  desiredDomain: z.string().min(1).optional(),
  communicationOption: z.string().min(1),
  setupTotalGbp: z.number().int().nonnegative(),
  monthlyTotalGbp: z.number().int().nonnegative(),
  status: z.string().min(1),
  notes: z.string().optional(),
  rawPayload: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).optional(),
});

export const updateSetupRequestStatusSchema = z.object({
  setupRequestId: z.string().cuid(),
  status: z.string().min(1),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).or(z.array(z.unknown())).optional(),
});

export type CreateSetupRequestInput = z.infer<typeof createSetupRequestSchema>;
export type UpdateSetupRequestStatusInput = z.infer<typeof updateSetupRequestStatusSchema>;
