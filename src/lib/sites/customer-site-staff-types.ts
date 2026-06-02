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
  staffPermissions?: CustomerSiteStaffPermissions | null;
  availableWeekdays?: WeekdayValue[] | null;
  serviceIds?: string[] | null;
  notes?: string | null;
  sortOrder?: number;
};

export type CustomerSiteStaffPermissions = {
  viewAppointments: boolean;
  markCompleted: boolean;
  addManualBooking: boolean;
  amendBooking: boolean;
  cancelBooking: boolean;
  viewCustomerContactDetails: boolean;
  viewPaymentStatus: boolean;
  redeemVouchers: boolean;
};

export const DEFAULT_STANDARD_STAFF_PERMISSIONS: CustomerSiteStaffPermissions = {
  viewAppointments: true,
  markCompleted: false,
  addManualBooking: false,
  amendBooking: false,
  cancelBooking: false,
  viewCustomerContactDetails: false,
  viewPaymentStatus: false,
  redeemVouchers: false,
};

export const DEFAULT_SUPER_USER_STAFF_PERMISSIONS: CustomerSiteStaffPermissions = {
  viewAppointments: true,
  markCompleted: true,
  addManualBooking: false,
  amendBooking: false,
  cancelBooking: false,
  viewCustomerContactDetails: true,
  viewPaymentStatus: true,
  redeemVouchers: false,
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
  staffPermissions: CustomerSiteStaffPermissions;
  availableWeekdays: WeekdayValue[];
  serviceIds: string[];
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
