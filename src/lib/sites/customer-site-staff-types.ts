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

export type CustomerSiteStaffRoleInput = {
  id?: string;
  label: string;
  platformRole?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export type CustomerSiteStaffMemberInput = {
  id?: string;
  roleId?: string | null;
  displayName: string;
  roleLabel?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  active?: boolean;
  customerSelectable?: boolean;
  isSuperUser?: boolean;
  availableWeekdays?: WeekdayValue[] | null;
  serviceIds?: string[] | null;
  notes?: string | null;
  sortOrder?: number;
};

export type CustomerSiteStaffRoleRecord = {
  id: string;
  tenantSiteId: string;
  label: string;
  platformRole: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteStaffMemberRecord = {
  id: string;
  tenantSiteId: string;
  roleId: string | null;
  displayName: string;
  roleLabel: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  active: boolean;
  customerSelectable: boolean;
  isSuperUser: boolean;
  staffAccessEnabled: boolean;
  staffAccessCodeExists: boolean;
  availableWeekdays: WeekdayValue[];
  serviceIds: string[];
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
