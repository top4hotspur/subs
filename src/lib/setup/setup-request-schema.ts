import { z } from "zod";

const cuidString = z.string().cuid();
const nonEmpty = z.string().trim().min(1);
const jsonValue = z.unknown();

export const createSetupRequestSchema = z.object({
  tenantSiteId: cuidString.optional(),
  demoDraftSnapshotId: cuidString.optional(),
  industrySlug: nonEmpty,
  businessName: nonEmpty,
  contactName: nonEmpty.optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().min(3).optional(),
  domainOption: nonEmpty,
  existingDomain: nonEmpty.optional(),
  desiredDomain: nonEmpty.optional(),
  communicationOption: nonEmpty,
  setupTotalGbp: z.number().int().nonnegative(),
  monthlyTotalGbp: z.number().int().nonnegative(),
  status: nonEmpty,
  notes: z.string().optional(),
  rawPayload: jsonValue.optional(),
  honeypot: z.string().optional(),
  formStartedAt: z.number().int().optional(),
});

export const updateSetupRequestStatusSchema = z.object({
  setupRequestId: cuidString,
  status: nonEmpty,
  message: z.string().optional(),
  metadata: jsonValue.optional(),
});

export const listSetupRequestsSchema = z.object({
  tenantSiteId: cuidString.optional(),
  industrySlug: nonEmpty.optional(),
  status: nonEmpty.optional(),
  contactEmail: z.string().email().optional(),
  take: z.number().int().min(1).max(200).optional().default(50),
  skip: z.number().int().min(0).optional().default(0),
});

export const createDemoDraftSnapshotSchema = z.object({
  tenantSiteId: cuidString.optional(),
  setupRequestId: cuidString.optional(),
  templateSlug: nonEmpty,
  draftName: z.string().trim().min(1).optional(),
  draftJson: jsonValue,
  source: z.string().trim().min(1).optional(),
});

export const createSetupRequestEventSchema = z.object({
  setupRequestId: cuidString,
  eventType: nonEmpty,
  message: z.string().optional(),
  metadata: jsonValue.optional(),
});
