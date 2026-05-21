import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type BusinessClosureDate = {
  id: string;
  industrySlug: WebsiteTemplateSlug;
  date: string;
  label: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  active: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

export type StaffHolidayDate = {
  id: string;
  staffId: string;
  date: string;
  label: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  active: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

