import { WebsiteTemplateSlug } from "@/lib/sites/types";

const TAXI_INDUSTRY: WebsiteTemplateSlug = "taxi";

export function isTaxiIndustry(slug: WebsiteTemplateSlug): boolean {
  return slug === TAXI_INDUSTRY;
}

export function taxiRequestHeading(): string {
  return "Request fare or book ride";
}

export function taxiJourneyTypeOptions(): string[] {
  return [
    "Local taxi/private hire",
    "Airport transfer",
    "Corporate/operator booking",
    "Golf transfer",
    "Tourist tour",
    "Event transport",
    "Other",
  ];
}

export function taxiPassengerOptions(): string[] {
  return ["1", "2", "3", "4", "5", "6", "7+"];
}

export function taxiLuggageOptions(): string[] {
  return ["None", "1 bag", "2 bags", "3 bags", "4+ bags"];
}

export function taxiAdminLabel(): string {
  return "Taxi/private-hire workflow view";
}

export function taxiRequiredFieldLabels(): string[] {
  return [
    "Customer name",
    "Email or phone",
    "Pickup address",
    "Destination address",
    "Pickup date",
    "Pickup time",
    "Journey type",
  ];
}
