import {
  AvailabilityWindowType,
  Weekday,
} from "@/lib/calendar/calendar-types";
import {
  NotificationChannel,
  NotificationEventType,
  NotificationTemplateTone,
} from "@/lib/notifications/notification-types";
import {
  CustomerRequestKind,
  CustomerRequestLocationType,
  CustomerRequestPricingStatus,
  CustomerRequestStatus,
} from "@/lib/requests/request-types";
import {
  CommunicationOption,
  DomainOption,
} from "@/lib/sites/types";
import {
  StaffAssignmentMode,
  StaffAvailabilityMode,
  StaffRoleType,
} from "@/lib/staff/staff-types";

export function domainOptionLabel(option: DomainOption): string {
  switch (option) {
    case DomainOption.EXISTING_DOMAIN:
      return "Existing domain";
    case DomainOption.CUSTOMER_BUYS_DOMAIN:
      return "Customer buys domain";
    case DomainOption.WE_REGISTER_DOMAIN:
      return "We register/manage domain";
    default:
      return option;
  }
}

export function domainOptionDescription(option: DomainOption): string {
  switch (option) {
    case DomainOption.EXISTING_DOMAIN:
      return "Customer already owns a domain and can point DNS/nameservers.";
    case DomainOption.CUSTOMER_BUYS_DOMAIN:
      return "Customer will buy a new domain and then point it to us.";
    case DomainOption.WE_REGISTER_DOMAIN:
      return "We register/manage domain as an optional paid setup extra.";
    default:
      return "Domain option selected.";
  }
}

export function communicationOptionLabel(option: CommunicationOption): string {
  return option === CommunicationOption.EMAIL_AND_WHATSAPP
    ? "Email + WhatsApp"
    : "Email only";
}

export function communicationOptionDescription(option: CommunicationOption): string {
  return option === CommunicationOption.EMAIL_AND_WHATSAPP
    ? "Email plus optional WhatsApp add-on notifications."
    : "Standard email notifications included.";
}

export function customerRequestKindLabel(kind: CustomerRequestKind): string {
  return kind.replaceAll("_", " ");
}

export function customerRequestStatusLabel(status: CustomerRequestStatus): string {
  return status.replaceAll("_", " ");
}

export function customerRequestStatusDescription(status: CustomerRequestStatus): string {
  switch (status) {
    case CustomerRequestStatus.DRAFT:
      return "Draft request not yet submitted.";
    case CustomerRequestStatus.SUBMITTED:
      return "Request submitted and awaiting triage.";
    case CustomerRequestStatus.REVIEWING:
      return "Request is currently under review.";
    case CustomerRequestStatus.QUOTED:
      return "Quote has been prepared and shared.";
    case CustomerRequestStatus.ACCEPTED:
      return "Quote/request accepted by customer.";
    case CustomerRequestStatus.PAYMENT_PENDING:
      return "Waiting for payment confirmation.";
    case CustomerRequestStatus.CONFIRMED:
      return "Booking/request confirmed.";
    case CustomerRequestStatus.STAFF_ALLOCATED:
      return "A staff member has been assigned.";
    case CustomerRequestStatus.IN_PROGRESS:
      return "Work is currently in progress.";
    case CustomerRequestStatus.COMPLETED:
      return "Work marked complete.";
    case CustomerRequestStatus.CANCELLED:
      return "Request cancelled.";
    case CustomerRequestStatus.NO_SHOW:
      return "Customer no-show recorded.";
    default:
      return "Status update.";
  }
}

export function customerRequestStatusTone(status: CustomerRequestStatus): string {
  switch (status) {
    case CustomerRequestStatus.COMPLETED:
      return "success";
    case CustomerRequestStatus.CANCELLED:
    case CustomerRequestStatus.NO_SHOW:
      return "danger";
    case CustomerRequestStatus.QUOTED:
    case CustomerRequestStatus.PAYMENT_PENDING:
      return "warning";
    default:
      return "info";
  }
}

export function customerRequestPricingStatusLabel(status: CustomerRequestPricingStatus): string {
  return status.replaceAll("_", " ");
}

export function customerRequestLocationTypeLabel(type: CustomerRequestLocationType): string {
  return type.replaceAll("_", " ");
}

export function staffRoleLabel(role: StaffRoleType): string {
  return role.replaceAll("_", " ");
}

export function staffAvailabilityModeLabel(mode: StaffAvailabilityMode): string {
  return mode.replaceAll("_", " ");
}

export function staffAssignmentModeLabel(mode: StaffAssignmentMode): string {
  return mode.replaceAll("_", " ");
}

export function availabilityWindowTypeLabel(type: AvailabilityWindowType): string {
  return type.replaceAll("_", " ");
}

export function weekdayLabel(weekday: Weekday): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function notificationChannelLabel(channel: NotificationChannel): string {
  return channel === NotificationChannel.EMAIL ? "Email" : "WhatsApp";
}

export function notificationEventTypeLabel(eventType: NotificationEventType): string {
  return eventType.replaceAll("_", " ");
}

export function notificationToneLabel(tone: NotificationTemplateTone): string {
  return tone.charAt(0).toUpperCase() + tone.slice(1).toLowerCase();
}

export function formatGbp(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

export function formatIsoDateTime(value?: string): string {
  return formatUkDateTime(value);
}

export function formatUkDate(value?: string): string {
  if (!value) return "-";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

export function formatUkDateTime(value?: string): string {
  if (!value) return "-";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (dateOnly) return date.toLocaleDateString("en-GB");
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOptional(value?: string | null, fallback = "-"): string {
  const trimmed = value?.toString().trim();
  return trimmed ? trimmed : fallback;
}



export function formatSiteCurrency(value: number, currency: "GBP" | "EUR" | "USD" = "GBP"): string {
  const locale = currency === "USD" ? "en-US" : currency === "EUR" ? "de-DE" : "en-GB";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

