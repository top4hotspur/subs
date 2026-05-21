import { WebsiteTemplateSlug } from "@/lib/sites/types";

export enum CustomerRequestKind {
  ENQUIRY = "ENQUIRY",
  QUOTE_REQUEST = "QUOTE_REQUEST",
  BOOKING_REQUEST = "BOOKING_REQUEST",
  CONFIRMED_BOOKING = "CONFIRMED_BOOKING",
  JOB_REQUEST = "JOB_REQUEST",
}

export enum CustomerRequestStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  REVIEWING = "REVIEWING",
  QUOTED = "QUOTED",
  ACCEPTED = "ACCEPTED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  CONFIRMED = "CONFIRMED",
  STAFF_ALLOCATED = "STAFF_ALLOCATED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum CustomerRequestPricingStatus {
  NOT_REQUIRED = "NOT_REQUIRED",
  QUOTE_REQUIRED = "QUOTE_REQUIRED",
  QUOTE_SENT = "QUOTE_SENT",
  PRICE_CONFIRMED = "PRICE_CONFIRMED",
  PAYMENT_NOT_REQUIRED = "PAYMENT_NOT_REQUIRED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAID = "PAID",
}

export enum CustomerRequestCommunicationChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
}

export enum CustomerRequestLocationType {
  BUSINESS_PREMISES = "BUSINESS_PREMISES",
  CUSTOMER_ADDRESS = "CUSTOMER_ADDRESS",
  ROUTE = "ROUTE",
  ONLINE = "ONLINE",
  PHONE = "PHONE",
}

export type CustomerRequest = {
  id: string;
  templateSlug: WebsiteTemplateSlug;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  kind: CustomerRequestKind;
  status: CustomerRequestStatus;
  pricingStatus: CustomerRequestPricingStatus;
  serviceId?: string;
  serviceName?: string;
  preferredDate?: string;
  preferredTime?: string;
  estimatedDurationMinutes?: number;
  locationType: CustomerRequestLocationType;
  customerAddress?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  notes?: string;
  extraDetails?: Record<string, string>;
  frequency?: string;
  propertyType?: string;
  accessNotes?: string;
  preferredVisitWindow?: string;
  photoNotes?: string;
  vehicleDetails?: string;
  journeyType?: string;
  returnJourneyRequired?: boolean;
  returnDate?: string;
  returnTime?: string;
  passengerCount?: string;
  luggageCount?: string;
  flightNumber?: string;
  childSeatNotes?: string;
  accessibilityNotes?: string;
  corporateAccountReference?: string;
  stops?: string;
  preferredStaffId?: string;
  preferredStaffName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  quotedPriceGbp?: number;
  finalPriceGbp?: number;
  createdByStaff?: boolean;
  customerRegistrationRequired?: boolean;
  paymentRequired?: boolean;
  mockRegistrationPaymentLink?: string;
  registrationCompletedAtIso?: string;
  paymentCompletedAtIso?: string;
  communicationChannels: CustomerRequestCommunicationChannel[];
  completionMessageSentAtIso?: string;
  reviewRequestSentAtIso?: string;
  createdAtIso: string;
  updatedAtIso: string;
};
