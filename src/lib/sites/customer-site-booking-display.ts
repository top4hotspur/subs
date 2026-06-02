import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";

export function formatUkDateTime(value?: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(date);
}

export function formatBookingDateTime(booking: Pick<CustomerSiteBookingRecord, "preferredDate" | "preferredTime" | "startDateTime">): string {
  if (booking.startDateTime) return formatUkDateTime(booking.startDateTime);
  const date = booking.preferredDate || "-";
  const time = booking.preferredTime || "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    const dateObject = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(dateObject);
    return `${dateLabel}, ${time}`;
  }
  return `${date}, ${time}`;
}
