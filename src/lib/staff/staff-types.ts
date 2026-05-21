export enum StaffRoleType {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DRIVER = "DRIVER",
  BARBER = "BARBER",
  STYLIST = "STYLIST",
  BEAUTICIAN = "BEAUTICIAN",
  NAIL_TECHNICIAN = "NAIL_TECHNICIAN",
  MASSAGE_THERAPIST = "MASSAGE_THERAPIST",
  GROOMER = "GROOMER",
  CLEANER = "CLEANER",
  GARDENER = "GARDENER",
  VALETER = "VALETER",
  INSTRUCTOR = "INSTRUCTOR",
  GENERAL_STAFF = "GENERAL_STAFF",
}

export enum StaffAvailabilityMode {
  NOT_SCHEDULED = "NOT_SCHEDULED",
  FIXED_HOURS = "FIXED_HOURS",
  FLEXIBLE = "FLEXIBLE",
  APPOINTMENT_ONLY = "APPOINTMENT_ONLY",
  ROUTE_BASED = "ROUTE_BASED",
}

export type StaffMember = {
  id: string;
  displayName: string;
  role: StaffRoleType;
  roleLabel?: string;
  email?: string;
  phone?: string;
  bio?: string;
  serviceIds: string[];
  active: boolean;
  customerSelectable: boolean;
  availabilityMode: StaffAvailabilityMode;
  notes?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export enum StaffAssignmentMode {
  CUSTOMER_SELECTS = "CUSTOMER_SELECTS",
  BUSINESS_ALLOCATES = "BUSINESS_ALLOCATES",
  AUTO_ASSIGN_FUTURE = "AUTO_ASSIGN_FUTURE",
  NOT_REQUIRED = "NOT_REQUIRED",
}
