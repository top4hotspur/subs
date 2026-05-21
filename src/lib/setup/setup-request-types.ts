import { z } from "zod";
import {
  createDemoDraftSnapshotSchema,
  createSetupRequestEventSchema,
  createSetupRequestSchema,
  listSetupRequestsSchema,
  updateSetupRequestStatusSchema,
} from "@/lib/setup/setup-request-schema";

export type CreateSetupRequestInput = z.infer<typeof createSetupRequestSchema>;
export type UpdateSetupRequestStatusInput = z.infer<typeof updateSetupRequestStatusSchema>;
export type ListSetupRequestsInput = z.infer<typeof listSetupRequestsSchema>;
export type CreateDemoDraftSnapshotInput = z.infer<typeof createDemoDraftSnapshotSchema>;
export type CreateSetupRequestEventInput = z.infer<typeof createSetupRequestEventSchema>;
