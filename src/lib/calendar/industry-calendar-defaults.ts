import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { AvailabilityWindowType } from "@/lib/calendar/calendar-types";

export function getDefaultAvailabilityWindowTypeForIndustry(
  slug: WebsiteTemplateSlug,
): AvailabilityWindowType {
  switch (slug) {
    case "taxi":
      return AvailabilityWindowType.ROUTE_BASED;
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
      return AvailabilityWindowType.FLEXIBLE_JOB_WINDOW;
    case "barbers":
    case "hairdressers":
    case "beauticians":
    case "nail-salon":
    case "massage":
    case "dog-grooming":
    case "driving-instructors":
      return AvailabilityWindowType.APPOINTMENT_ONLY;
    default:
      return AvailabilityWindowType.OPEN;
  }
}

export function getDefaultSchedulingNoteForIndustry(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "taxi":
      return "Journey timing is confirmed by the operator based on route demand and driver coverage.";
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
      return "Requests are confirmed into flexible visit windows rather than strict appointment slots.";
    case "driving-instructors":
      return "Lesson slots are typically scheduled in fixed 60-minute windows.";
    default:
      return "Appointments are typically managed in fixed slots with confirmation after request review.";
  }
}

export function getDefaultServiceDurationForIndustry(slug: WebsiteTemplateSlug): number {
  switch (slug) {
    case "massage":
      return 60;
    case "driving-instructors":
      return 60;
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
      return 90;
    case "taxi":
      return 45;
    default:
      return 45;
  }
}

export function shouldUseFixedSlotsByDefault(slug: WebsiteTemplateSlug): boolean {
  return [
    "barbers",
    "hairdressers",
    "beauticians",
    "nail-salon",
    "massage",
    "dog-grooming",
    "driving-instructors",
  ].includes(slug);
}

export function shouldUseFlexibleWindowsByDefault(slug: WebsiteTemplateSlug): boolean {
  return ["window-cleaning", "cleaners", "gardeners", "mobile-valeting"].includes(slug);
}

