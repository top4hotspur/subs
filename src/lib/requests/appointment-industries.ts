import { WebsiteTemplateSlug } from "@/lib/sites/types";

const APPOINTMENT_STYLE_INDUSTRIES: WebsiteTemplateSlug[] = [
  "barbers",
  "hairdressers",
  "nail-salon",
];

export function isAppointmentStyleIndustry(slug: WebsiteTemplateSlug): boolean {
  return APPOINTMENT_STYLE_INDUSTRIES.includes(slug);
}
