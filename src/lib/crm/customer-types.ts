import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type CustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  tags: string[];
  createdAtIso: string;
  updatedAtIso: string;
  lastBookingAtIso?: string;
  totalBookings: number;
  totalCompletedBookings: number;
};

export type CustomerBookingHistoryItem = {
  requestId: string;
  industrySlug: WebsiteTemplateSlug;
  serviceName?: string;
  status: CustomerRequestStatus;
  preferredDate?: string;
  preferredTime?: string;
  finalPriceGbp?: number;
  createdAtIso: string;
};
