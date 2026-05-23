import { NotificationEventType } from "@/lib/notifications/notification-types";
import { CustomerRequest } from "@/lib/requests/request-types";

export const LOCAL_NOTIFICATION_EVENTS_KEY = "subs-local-notification-events";

export type LocalNotificationEvent = {
  id: string;
  industrySlug: string;
  eventType: NotificationEventType;
  channel: "EMAIL";
  recipient: string;
  subject: string;
  body: string;
  requestId?: string;
  createdAtIso: string;
  status: "PREPARED";
};

function readEvents(): LocalNotificationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFICATION_EVENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalNotificationEvent[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: LocalNotificationEvent[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_NOTIFICATION_EVENTS_KEY, JSON.stringify(events));
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function dateOrTbc(value?: string): string {
  return value?.trim() ? value : "To be confirmed";
}

export function listLocalNotificationEvents(): LocalNotificationEvent[] {
  return readEvents().sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

export function prepareLocalBookingAutoResponse(request: CustomerRequest): LocalNotificationEvent {
  const now = new Date().toISOString();
  const recipient = request.customerEmail?.trim() || request.customerPhone?.trim() || request.customerName;
  const subject = `${request.serviceName || "Service request"} received`;
  const body = [
    `Hi ${request.customerName},`,
    "",
    `Thanks for your ${request.kind === "BOOKING_REQUEST" ? "booking" : "request"}.`,
    `Service: ${request.serviceName || "Selected service"}`,
    `Date: ${dateOrTbc(request.preferredDate)}`,
    `Time: ${dateOrTbc(request.preferredTime)}`,
    "",
    "Your business will confirm final details if needed.",
    "You can manage your booking/request from your account area.",
  ].join("\n");

  const event: LocalNotificationEvent = {
    id: makeId(),
    industrySlug: request.templateSlug,
    eventType: NotificationEventType.CUSTOMER_REQUEST_RECEIVED,
    channel: "EMAIL",
    recipient,
    subject,
    body,
    requestId: request.id,
    createdAtIso: now,
    status: "PREPARED",
  };

  const events = readEvents();
  events.unshift(event);
  writeEvents(events);
  return event;
}
