import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  CustomerRequestKind,
  CustomerRequestLocationType,
} from "@/lib/requests/request-types";

export function getDefaultRequestKindForIndustry(
  slug: WebsiteTemplateSlug,
): CustomerRequestKind {
  switch (slug) {
    case "taxi":
      return CustomerRequestKind.QUOTE_REQUEST;
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
      return CustomerRequestKind.QUOTE_REQUEST;
    case "mobile-valeting":
      return CustomerRequestKind.JOB_REQUEST;
    case "driving-instructors":
      return CustomerRequestKind.ENQUIRY;
    default:
      return CustomerRequestKind.BOOKING_REQUEST;
  }
}

export function getDefaultLocationTypeForIndustry(
  slug: WebsiteTemplateSlug,
): CustomerRequestLocationType {
  switch (slug) {
    case "taxi":
      return CustomerRequestLocationType.ROUTE;
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
    case "driving-instructors":
      return CustomerRequestLocationType.CUSTOMER_ADDRESS;
    default:
      return CustomerRequestLocationType.BUSINESS_PREMISES;
  }
}

export function getSuggestedRequestFieldsForIndustry(
  slug: WebsiteTemplateSlug,
): string[] {
  switch (slug) {
    case "taxi":
      return ["pickup", "destination", "date/time", "passengers", "luggage"];
    case "driving-instructors":
      return ["pickup area", "lesson type", "availability", "customer details"];
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
      return ["address", "service", "preferred date", "notes"];
    default:
      return ["service", "date/time", "customer details"];
  }
}

export function getRequestActionLabelForIndustry(
  slug: WebsiteTemplateSlug,
): string {
  switch (slug) {
    case "taxi":
      return "Request a quote";
    case "window-cleaning":
    case "cleaners":
    case "gardeners":
    case "mobile-valeting":
      return "Request a quote";
    case "driving-instructors":
      return "Enquire about lessons";
    default:
      return "Book an appointment";
  }
}
