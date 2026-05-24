export type CustomerSiteBookingStatus =
  | "SUBMITTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type CustomerSitePaymentStatus =
  | "PAYMENT_REQUIRED"
  | "PAYMENT_COMPLETED"
  | "NOT_REQUIRED";

export type CustomerSiteBookingRecord = {
  id: string;
  tenantSiteId: string;
  serviceId: string | null;
  serviceName: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  staffMemberId: string | null;
  staffName: string | null;
  status: CustomerSiteBookingStatus;
  paymentStatus: CustomerSitePaymentStatus | null;
  notes: string | null;
  source: string | null;
  rawPayload: unknown;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteBookingListOptions = {
  status?: CustomerSiteBookingStatus | null;
  preferredDate?: string | null;
  take?: number;
  skip?: number;
};

