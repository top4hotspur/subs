export type CustomerSiteBookingStatus =
  | "REQUESTED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type CustomerSitePaymentStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_COMPLETED";

export type CustomerSitePaymentMethod =
  | "NONE"
  | "CASH"
  | "CARD_ONLINE"
  | "MANUAL";

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
  startDateTime: string | null;
  endDateTime: string | null;
  staffMemberId: string | null;
  staffName: string | null;
  status: CustomerSiteBookingStatus;
  paymentStatus: CustomerSitePaymentStatus | null;
  paymentMethod: CustomerSitePaymentMethod | null;
  paymentAmountPence: number | null;
  paymentCurrency: string | null;
  paymentProvider: string | null;
  paymentProviderSessionId: string | null;
  paymentProviderPaymentIntentId: string | null;
  notes: string | null;
  policyAcceptedAt: string | null;
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
