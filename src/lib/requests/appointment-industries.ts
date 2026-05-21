import { WebsiteTemplateSlug } from "@/lib/sites/types";

const APPOINTMENT_STYLE_INDUSTRIES: WebsiteTemplateSlug[] = [
  "barbers",
  "hairdressers",
  "nail-salon",
  "beauticians",
  "massage",
  "dog-grooming",
];

export function isAppointmentStyleIndustry(slug: WebsiteTemplateSlug): boolean {
  return APPOINTMENT_STYLE_INDUSTRIES.includes(slug);
}

export function getAppointmentServiceLabel(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "beauticians":
      return "Select treatment";
    case "massage":
      return "Select massage session";
    case "dog-grooming":
      return "Select grooming service";
    default:
      return "Select appointment service";
  }
}

export function getAppointmentStaffLabel(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "beauticians":
      return "Preferred beautician (optional)";
    case "massage":
      return "Preferred therapist (optional)";
    case "dog-grooming":
      return "Preferred groomer (optional)";
    default:
      return "Preferred barber/stylist (optional)";
  }
}

export function getAppointmentActionHeading(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "beauticians":
      return "Book treatment";
    case "massage":
      return "Book massage session";
    case "dog-grooming":
      return "Book grooming appointment";
    default:
      return "Book appointment request";
  }
}
