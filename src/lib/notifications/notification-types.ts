import { WebsiteTemplateSlug } from "@/lib/sites/types";

export enum NotificationChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
}

export enum NotificationEventType {
  SETUP_REQUEST_RECEIVED = "SETUP_REQUEST_RECEIVED",
  CUSTOMER_REQUEST_RECEIVED = "CUSTOMER_REQUEST_RECEIVED",
  QUOTE_SENT = "QUOTE_SENT",
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  STAFF_ASSIGNED = "STAFF_ASSIGNED",
  REMINDER = "REMINDER",
  JOB_COMPLETED = "JOB_COMPLETED",
  REVIEW_REQUEST = "REVIEW_REQUEST",
  REQUEST_CANCELLED = "REQUEST_CANCELLED",
  REQUEST_CHANGED = "REQUEST_CHANGED",
}

export enum NotificationTemplateTone {
  FRIENDLY = "FRIENDLY",
  PROFESSIONAL = "PROFESSIONAL",
  SHORT = "SHORT",
}

export type NotificationTemplate = {
  id: string;
  industrySlug: WebsiteTemplateSlug;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
  subject?: string;
  body: string;
  tone: NotificationTemplateTone;
  variables: string[];
  createdAtIso: string;
  updatedAtIso: string;
};

export type NotificationPreviewContext = {
  businessName: string;
  customerName: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  staffName?: string;
  websiteUrl?: string;
  reviewUrl?: string;
  nextBookingDate?: string;
};

export const NOTIFICATION_VARIABLES = [
  "businessName",
  "customerName",
  "serviceName",
  "bookingDate",
  "bookingTime",
  "staffName",
  "websiteUrl",
  "reviewUrl",
  "nextBookingDate",
] as const;

