export const WEEKDAY_VALUES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type WeekdayValue = (typeof WEEKDAY_VALUES)[number];

export type CustomerSiteStaffRotaDayInput = {
  id?: string;
  staffMemberId: string;
  weekday: WeekdayValue;
  working?: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type CustomerSiteStaffBreakWindowInput = {
  id?: string;
  staffMemberId: string;
  rotaDayId?: string | null;
  weekday: WeekdayValue;
  label?: string | null;
  startTime: string;
  endTime: string;
  active?: boolean;
};

export type CustomerSiteBusinessClosureInput = {
  id?: string;
  date: string;
  endDate?: string | null;
  label: string;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  active?: boolean;
  customerNote?: string | null;
};

export type CustomerSiteStaffHolidayInput = {
  id?: string;
  staffMemberId: string;
  date: string;
  endDate?: string | null;
  label: string;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  active?: boolean;
  notes?: string | null;
};

export type CustomerSiteStaffRotaDayRecord = {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  weekday: WeekdayValue;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteStaffBreakWindowRecord = {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  rotaDayId: string | null;
  weekday: WeekdayValue;
  label: string | null;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteBusinessClosureRecord = {
  id: string;
  tenantSiteId: string;
  date: string;
  endDate: string | null;
  label: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteStaffHolidayRecord = {
  id: string;
  tenantSiteId: string;
  staffMemberId: string;
  date: string;
  endDate: string | null;
  label: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteSchedulingSnapshot = {
  rotaDays: CustomerSiteStaffRotaDayRecord[];
  breakWindows: CustomerSiteStaffBreakWindowRecord[];
  businessClosures: CustomerSiteBusinessClosureRecord[];
  staffHolidays: CustomerSiteStaffHolidayRecord[];
};
