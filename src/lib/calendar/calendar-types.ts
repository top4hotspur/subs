import { WebsiteTemplateSlug } from "@/lib/sites/types";

export enum AvailabilityWindowType {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  APPOINTMENT_ONLY = "APPOINTMENT_ONLY",
  FLEXIBLE_JOB_WINDOW = "FLEXIBLE_JOB_WINDOW",
  ROUTE_BASED = "ROUTE_BASED",
}

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type StaffAvailabilityWindow = {
  id: string;
  staffId: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  type: AvailabilityWindowType;
  notes?: string;
  active: boolean;
};

export type BusinessAvailabilityWindow = {
  id: string;
  industrySlug: WebsiteTemplateSlug;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  type: AvailabilityWindowType;
  notes?: string;
  active: boolean;
};

export type ServiceSchedulingRule = {
  serviceId: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  requiresStaff: boolean;
  allowCustomerStaffChoice: boolean;
  maxBookingsPerSlot?: number;
  notes?: string;
};

export type StaffBreakWindow = {
  id: string;
  staffId: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  label?: string;
  active: boolean;
};

export type StaffRotaDay = {
  staffId: string;
  weekday: Weekday;
  working: boolean;
  startTime?: string;
  endTime?: string;
  breaks: StaffBreakWindow[];
};

export type CalendarPreviewItem = {
  id: string;
  industrySlug: WebsiteTemplateSlug;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  serviceName?: string;
  staffName?: string;
  status: string;
  notes?: string;
};

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

