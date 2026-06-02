import { z } from "zod";

const cuid = z.string().cuid();
const nonEmpty = z.string().trim().min(1);
const jsonValue = z.unknown();

export const createTenantSiteFromSetupRequestSchema = z.object({
  setupRequestId: cuid,
});

export const updateTenantSiteStatusSchema = z.object({
  tenantSiteId: cuid,
  status: nonEmpty.optional(),
  provisioningStatus: nonEmpty.optional(),
  subscriptionStatus: nonEmpty.optional(),
  domainStatus: nonEmpty.optional(),
  domainPrimary: z.string().trim().min(1).optional(),
  whatsappAddonEnabled: z.boolean().optional(),
});

export const createOrUpdateSiteDomainSchema = z.object({
  tenantSiteId: cuid,
  domain: nonEmpty,
  domainType: z.enum(["PRIMARY", "APEX", "WWW", "ALIAS"]).optional().default("PRIMARY"),
  status: nonEmpty,
  registrarNotes: z.string().optional(),
  dnsInstructions: jsonValue.optional(),
});

export const listTenantSitesSchema = z.object({
  industrySlug: z.string().trim().min(1).optional(),
  provisioningStatus: z.string().trim().min(1).optional(),
  take: z.number().int().min(1).max(200).optional().default(50),
  skip: z.number().int().min(0).optional().default(0),
});

export const updateProvisioningTaskStatusSchema = z.object({
  taskId: cuid,
  status: nonEmpty,
  notes: z.string().optional(),
  metadata: jsonValue.optional(),
});

export const createSiteStatusEventSchema = z.object({
  tenantSiteId: cuid,
  eventType: nonEmpty,
  message: z.string().optional(),
  metadata: jsonValue.optional(),
});
