import { z } from "zod";

export const tenantSiteIdSchema = z.object({
  tenantSiteId: z.string().cuid(),
});

export const invitationStatusSchema = z.enum(["INVITED", "ACTIVE", "DISABLED"]);
export const siteAdminRoleSchema = z.enum(["OWNER", "ADMIN"]);

export const createCustomerSiteAdminUserSchema = z.object({
  tenantSiteId: z.string().cuid(),
  email: z.string().trim().toLowerCase().email(),
  displayName: z.string().trim().max(120).nullable().optional(),
  role: siteAdminRoleSchema.default("OWNER"),
  active: z.boolean().optional().default(true),
  invitationStatus: invitationStatusSchema.default("INVITED"),
  accessCode: z.string().trim().min(6).max(64).optional(),
});

export const updateCustomerSiteAdminUserSchema = z.object({
  tenantSiteId: z.string().cuid(),
  id: z.string().cuid(),
  displayName: z.string().trim().max(120).nullable().optional(),
  role: siteAdminRoleSchema.optional(),
  active: z.boolean().optional(),
  invitationStatus: invitationStatusSchema.optional(),
  accessCode: z.string().trim().min(6).max(64).optional(),
});

export const siteAdminLoginSchema = z.object({
  siteSlug: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  accessCode: z.string().trim().min(1).max(128),
});

