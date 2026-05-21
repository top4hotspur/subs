import { WebsiteTemplateSlug } from "@/lib/sites/types";

const FLEXIBLE_JOB_INDUSTRIES: WebsiteTemplateSlug[] = [
  "window-cleaning",
  "cleaners",
  "gardeners",
  "mobile-valeting",
];

export function isFlexibleJobIndustry(slug: WebsiteTemplateSlug): boolean {
  return FLEXIBLE_JOB_INDUSTRIES.includes(slug);
}

export function flexibleJobHeading(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "window-cleaning":
      return "Request window cleaning quote";
    case "cleaners":
      return "Request cleaning service";
    case "gardeners":
      return "Request gardening job";
    case "mobile-valeting":
      return "Request mobile valeting";
    default:
      return "Request service quote";
  }
}

export function flexibleJobServiceLabel(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "window-cleaning":
      return "Select window cleaning service";
    case "cleaners":
      return "Select cleaning service";
    case "gardeners":
      return "Select gardening service";
    case "mobile-valeting":
      return "Select valeting package";
    default:
      return "Select service";
  }
}

export function flexibleJobAddressLabel(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "mobile-valeting":
      return "Vehicle location";
    case "gardeners":
      return "Job address";
    default:
      return "Property address";
  }
}

export function flexibleJobFrequencyOptions(slug: WebsiteTemplateSlug): string[] {
  if (!isFlexibleJobIndustry(slug)) return [];
  return ["One-off", "Weekly", "Fortnightly", "Monthly", "Not sure yet"];
}

export function flexibleJobAdminLabel(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "window-cleaning":
      return "Window cleaning workflow view";
    case "cleaners":
      return "Cleaning workflow view";
    case "gardeners":
      return "Gardening workflow view";
    case "mobile-valeting":
      return "Mobile valeting workflow view";
    default:
      return "Flexible job workflow view";
  }
}
