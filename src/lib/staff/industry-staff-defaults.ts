import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  StaffAvailabilityMode,
  StaffRoleType,
} from "@/lib/staff/staff-types";

export function getDefaultStaffRoleForIndustry(slug: WebsiteTemplateSlug): StaffRoleType {
  switch (slug) {
    case "taxi":
      return StaffRoleType.DRIVER;
    case "barbers":
      return StaffRoleType.BARBER;
    case "hairdressers":
      return StaffRoleType.STYLIST;
    case "beauticians":
      return StaffRoleType.BEAUTICIAN;
    case "nail-salon":
      return StaffRoleType.NAIL_TECHNICIAN;
    case "massage":
      return StaffRoleType.MASSAGE_THERAPIST;
    case "dog-grooming":
      return StaffRoleType.GROOMER;
    case "driving-instructors":
      return StaffRoleType.INSTRUCTOR;
    case "mobile-valeting":
      return StaffRoleType.VALETER;
    case "cleaners":
      return StaffRoleType.CLEANER;
    case "gardeners":
      return StaffRoleType.GARDENER;
    default:
      return StaffRoleType.GENERAL_STAFF;
  }
}

export function getDefaultStaffAvailabilityModeForIndustry(
  slug: WebsiteTemplateSlug,
): StaffAvailabilityMode {
  switch (slug) {
    case "taxi":
      return StaffAvailabilityMode.ROUTE_BASED;
    case "barbers":
    case "hairdressers":
      return StaffAvailabilityMode.FIXED_HOURS;
    case "beauticians":
    case "nail-salon":
    case "massage":
    case "dog-grooming":
      return StaffAvailabilityMode.APPOINTMENT_ONLY;
    case "window-cleaning":
    case "mobile-valeting":
      return StaffAvailabilityMode.ROUTE_BASED;
    case "cleaners":
    case "gardeners":
    case "driving-instructors":
      return StaffAvailabilityMode.FLEXIBLE;
    default:
      return StaffAvailabilityMode.NOT_SCHEDULED;
  }
}

export function shouldCustomersSelectStaffByDefault(slug: WebsiteTemplateSlug): boolean {
  switch (slug) {
    case "barbers":
    case "hairdressers":
      return true;
    default:
      return false;
  }
}

export function getDefaultStaffLabelForIndustry(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "taxi":
      return "Driver";
    case "barbers":
      return "Barber";
    case "hairdressers":
      return "Stylist";
    case "beauticians":
      return "Beautician";
    case "nail-salon":
      return "Nail technician";
    case "massage":
      return "Therapist";
    case "dog-grooming":
      return "Groomer";
    case "driving-instructors":
      return "Instructor";
    case "mobile-valeting":
      return "Valeter";
    case "cleaners":
      return "Cleaner";
    case "gardeners":
      return "Gardener";
    default:
      return "Team member";
  }
}
