import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type InStorePaymentMethod = "CASH" | "CARD";

export type InStoreSale = {
  id: string;
  industrySlug: WebsiteTemplateSlug;
  serviceId?: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  amount: number;
  currency: "GBP" | "EUR" | "USD";
  paymentMethod: InStorePaymentMethod;
  notes?: string;
  createdAtIso: string;
};
