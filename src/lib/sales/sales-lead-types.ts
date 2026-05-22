import { z } from "zod";
import {
  createSalesLeadEventSchema,
  createSalesLeadSchema,
  listSalesLeadsSchema,
  markSalesLeadContactedSchema,
  salesLeadStatusSchema,
  updateSalesLeadSchema,
} from "@/lib/sales/sales-lead-schema";

export type SalesLeadStatus = z.infer<typeof salesLeadStatusSchema>;
export type CreateSalesLeadInput = z.infer<typeof createSalesLeadSchema>;
export type UpdateSalesLeadInput = z.infer<typeof updateSalesLeadSchema>;
export type ListSalesLeadsInput = z.infer<typeof listSalesLeadsSchema>;
export type CreateSalesLeadEventInput = z.infer<typeof createSalesLeadEventSchema>;
export type MarkSalesLeadContactedInput = z.infer<typeof markSalesLeadContactedSchema>;
