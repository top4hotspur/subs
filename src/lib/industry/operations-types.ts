import { WebsiteTemplateSlug } from "@/lib/sites/types";

export enum IndustryOperationMode {
  BOOKING = "BOOKING",
  QUOTE_REQUEST = "QUOTE_REQUEST",
  ENQUIRY = "ENQUIRY",
  JOB_REQUEST = "JOB_REQUEST",
  PRODUCT_SERVICE_SELECTION = "PRODUCT_SERVICE_SELECTION",
}

export enum IndustrySchedulingMode {
  NONE = "NONE",
  FIXED_TIME_SLOT = "FIXED_TIME_SLOT",
  FLEXIBLE_JOB_WINDOW = "FLEXIBLE_JOB_WINDOW",
  DATE_ONLY = "DATE_ONLY",
  ROUTE_BASED = "ROUTE_BASED",
  LESSON_SLOT = "LESSON_SLOT",
}

export enum StaffAllocationMode {
  NOT_REQUIRED = "NOT_REQUIRED",
  CUSTOMER_SELECTS = "CUSTOMER_SELECTS",
  BUSINESS_ALLOCATES = "BUSINESS_ALLOCATES",
  AUTO_ASSIGN_FUTURE = "AUTO_ASSIGN_FUTURE",
}

export enum PricingMode {
  FIXED_SERVICE_PRICE = "FIXED_SERVICE_PRICE",
  FROM_PRICE = "FROM_PRICE",
  QUOTE_BASED = "QUOTE_BASED",
  DISTANCE_TIME_BASED = "DISTANCE_TIME_BASED",
  HOURLY = "HOURLY",
  PACKAGE_BASED = "PACKAGE_BASED",
}

export type IndustryOperationsBlueprint = {
  industrySlug: WebsiteTemplateSlug;
  publicActionLabel: string;
  primaryCustomerFlow: string;
  operationMode: IndustryOperationMode;
  schedulingMode: IndustrySchedulingMode;
  staffAllocationMode: StaffAllocationMode;
  pricingMode: PricingMode;
  customerPortalFeatures: string[];
  businessAdminFeatures: string[];
  requiredServiceFields: string[];
  optionalServiceFields: string[];
  bookingOrRequestFields: string[];
  jobLifecycleStages: string[];
  completionMessageEnabled: boolean;
  reviewRequestRecommended: boolean;
  analyticsRecommended: boolean;
  financialTrackingRecommended: boolean;
  notes: string[];
};
