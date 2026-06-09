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
  domainStatus: z.string().trim().optional(),
  domainSetupMode: z.string().trim().optional(),
  dnsStatus: z.string().trim().optional(),
  sslStatus: z.string().trim().optional(),
  nameserverInstructionsSentAt: z.coerce.date().nullable().optional(),
  dnsLastCheckedAt: z.coerce.date().nullable().optional(),
  dnsVerifiedAt: z.coerce.date().nullable().optional(),
  goLiveRequestedAt: z.coerce.date().nullable().optional(),
  wentLiveAt: z.coerce.date().nullable().optional(),
  domainNotes: z.string().nullable().optional(),
  expectedDnsTarget: z.string().nullable().optional(),
  expectedNameservers: jsonValue.optional(),
  lastDnsCheckResult: jsonValue.optional(),
  registrarNotes: z.string().nullable().optional(),
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
