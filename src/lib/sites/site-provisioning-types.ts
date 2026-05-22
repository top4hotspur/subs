import { z } from "zod";
import {
  createOrUpdateSiteDomainSchema,
  createSiteStatusEventSchema,
  createTenantSiteFromSetupRequestSchema,
  listTenantSitesSchema,
  updateProvisioningTaskStatusSchema,
  updateTenantSiteStatusSchema,
} from "@/lib/sites/site-provisioning-schema";

export type CreateTenantSiteFromSetupRequestInput = z.infer<
  typeof createTenantSiteFromSetupRequestSchema
>;
export type UpdateTenantSiteStatusInput = z.infer<typeof updateTenantSiteStatusSchema>;
export type CreateOrUpdateSiteDomainInput = z.infer<typeof createOrUpdateSiteDomainSchema>;
export type ListTenantSitesInput = z.infer<typeof listTenantSitesSchema>;
export type UpdateProvisioningTaskStatusInput = z.infer<
  typeof updateProvisioningTaskStatusSchema
>;
export type CreateSiteStatusEventInput = z.infer<typeof createSiteStatusEventSchema>;
