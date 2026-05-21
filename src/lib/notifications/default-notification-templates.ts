import { WebsiteTemplateSlug } from "@/lib/sites/types";
import {
  NotificationChannel,
  NotificationEventType,
  NotificationTemplate,
  NotificationTemplateTone,
} from "@/lib/notifications/notification-types";

const ALL_EVENTS: NotificationEventType[] = [
  NotificationEventType.SETUP_REQUEST_RECEIVED,
  NotificationEventType.CUSTOMER_REQUEST_RECEIVED,
  NotificationEventType.QUOTE_SENT,
  NotificationEventType.BOOKING_CONFIRMED,
  NotificationEventType.STAFF_ASSIGNED,
  NotificationEventType.REMINDER,
  NotificationEventType.JOB_COMPLETED,
  NotificationEventType.REVIEW_REQUEST,
  NotificationEventType.REQUEST_CANCELLED,
  NotificationEventType.REQUEST_CHANGED,
];

function generateId(eventType: NotificationEventType, channel: NotificationChannel): string {
  return `${eventType}_${channel}`;
}

function defaultVariablesForEvent(eventType: NotificationEventType): string[] {
  switch (eventType) {
    case NotificationEventType.SETUP_REQUEST_RECEIVED:
      return ["businessName", "customerName"];
    case NotificationEventType.CUSTOMER_REQUEST_RECEIVED:
      return ["businessName", "customerName", "serviceName", "bookingDate", "bookingTime"];
    case NotificationEventType.QUOTE_SENT:
      return ["businessName", "customerName", "serviceName", "websiteUrl"];
    case NotificationEventType.BOOKING_CONFIRMED:
      return ["businessName", "customerName", "serviceName", "bookingDate", "bookingTime", "staffName"];
    case NotificationEventType.STAFF_ASSIGNED:
      return ["businessName", "customerName", "staffName", "bookingDate", "bookingTime"];
    case NotificationEventType.REMINDER:
      return ["businessName", "customerName", "serviceName", "bookingDate", "bookingTime"];
    case NotificationEventType.JOB_COMPLETED:
      return ["businessName", "customerName", "serviceName", "nextBookingDate", "websiteUrl"];
    case NotificationEventType.REVIEW_REQUEST:
      return ["businessName", "customerName", "reviewUrl"];
    case NotificationEventType.REQUEST_CANCELLED:
    case NotificationEventType.REQUEST_CHANGED:
      return ["businessName", "customerName", "serviceName", "bookingDate", "bookingTime"];
    default:
      return ["businessName", "customerName"];
  }
}

export function getDefaultTemplateSubject(
  eventType: NotificationEventType,
  industrySlug: WebsiteTemplateSlug,
): string {
  switch (eventType) {
    case NotificationEventType.SETUP_REQUEST_RECEIVED:
      return `Setup request received - ${industrySlug}`;
    case NotificationEventType.CUSTOMER_REQUEST_RECEIVED:
      return "We received your request";
    case NotificationEventType.QUOTE_SENT:
      return "Your quote is ready";
    case NotificationEventType.BOOKING_CONFIRMED:
      return "Your booking is confirmed";
    case NotificationEventType.STAFF_ASSIGNED:
      return "Your team member has been assigned";
    case NotificationEventType.REMINDER:
      return "Reminder: upcoming booking";
    case NotificationEventType.JOB_COMPLETED:
      return "Booking completed confirmation";
    case NotificationEventType.REVIEW_REQUEST:
      return "Could you leave us a review?";
    case NotificationEventType.REQUEST_CANCELLED:
      return "Booking/request update: cancelled";
    case NotificationEventType.REQUEST_CHANGED:
      return "Booking/request update";
    default:
      return "Notification from {{businessName}}";
  }
}

export function getDefaultTemplateBody(
  eventType: NotificationEventType,
  channel: NotificationChannel,
  industrySlug: WebsiteTemplateSlug,
): string {
  if (channel === NotificationChannel.WHATSAPP) {
    switch (eventType) {
      case NotificationEventType.SETUP_REQUEST_RECEIVED:
        return "Hi {{customerName}}, we received your setup request for {{businessName}}.";
      case NotificationEventType.CUSTOMER_REQUEST_RECEIVED:
        return "Hi {{customerName}}, we received your {{serviceName}} request and will confirm soon.";
      case NotificationEventType.QUOTE_SENT:
        return "Hi {{customerName}}, your quote for {{serviceName}} is ready. Visit {{websiteUrl}}.";
      case NotificationEventType.BOOKING_CONFIRMED:
        return "Booking confirmed: {{serviceName}} on {{bookingDate}} at {{bookingTime}}.";
      case NotificationEventType.STAFF_ASSIGNED:
        return "{{staffName}} is assigned for your booking on {{bookingDate}} at {{bookingTime}}.";
      case NotificationEventType.REMINDER:
        return "Reminder: {{serviceName}} on {{bookingDate}} at {{bookingTime}}.";
      case NotificationEventType.JOB_COMPLETED:
        return "This is to confirm completion of your booking. Hope everything went well. See you on {{nextBookingDate}}. If not, hope to see you again soon at {{websiteUrl}}.";
      case NotificationEventType.REVIEW_REQUEST:
        return "Thanks for choosing us. Please leave a review: {{reviewUrl}}";
      case NotificationEventType.REQUEST_CANCELLED:
        return "Your request has been cancelled. Contact {{businessName}} if needed.";
      case NotificationEventType.REQUEST_CHANGED:
        return "Your request has been updated. Check details with {{businessName}}.";
      default:
        return "Message from {{businessName}}";
    }
  }

  switch (eventType) {
    case NotificationEventType.SETUP_REQUEST_RECEIVED:
      return "Hi {{customerName}},\n\nThanks for your setup request for {{businessName}}. Our team will review your details and contact you with the next steps.\n\n- {{businessName}}";
    case NotificationEventType.CUSTOMER_REQUEST_RECEIVED:
      return "Hi {{customerName}},\n\nWe have received your request for {{serviceName}}. If you provided a preferred time of {{bookingDate}} {{bookingTime}}, we will review and confirm availability shortly.\n\nThanks,\n{{businessName}}";
    case NotificationEventType.QUOTE_SENT:
      return "Hi {{customerName}},\n\nYour quote for {{serviceName}} is ready. Please visit {{websiteUrl}} for next steps.\n\nThanks,\n{{businessName}}";
    case NotificationEventType.BOOKING_CONFIRMED:
      return "Hi {{customerName}},\n\nYour booking is confirmed for {{serviceName}} on {{bookingDate}} at {{bookingTime}} with {{staffName}}.\n\nThanks,\n{{businessName}}";
    case NotificationEventType.STAFF_ASSIGNED:
      return "Hi {{customerName}},\n\nWe have assigned {{staffName}} to your booking on {{bookingDate}} at {{bookingTime}}.\n\nThanks,\n{{businessName}}";
    case NotificationEventType.REMINDER:
      return "Hi {{customerName}},\n\nJust a reminder for your upcoming {{serviceName}} booking on {{bookingDate}} at {{bookingTime}}.\n\nSee you soon,\n{{businessName}}";
    case NotificationEventType.JOB_COMPLETED:
      return "Hi {{customerName}},\n\nThis is to confirm completion of your booking. Hope everything went well.\n\nIf you have another booking, see you on {{nextBookingDate}}.\nIf not, hope to see you again soon: {{websiteUrl}}\n\nBest regards,\n{{businessName}}";
    case NotificationEventType.REVIEW_REQUEST:
      return "Hi {{customerName}},\n\nThank you for choosing {{businessName}}. We would really appreciate a quick review: {{reviewUrl}}\n\nThanks again,\n{{businessName}}";
    case NotificationEventType.REQUEST_CANCELLED:
      return "Hi {{customerName}},\n\nYour request for {{serviceName}} has been cancelled. If this was unexpected, please contact us.\n\n{{businessName}}";
    case NotificationEventType.REQUEST_CHANGED:
      return "Hi {{customerName}},\n\nYour request for {{serviceName}} has been updated. Current requested time: {{bookingDate}} {{bookingTime}}.\n\n{{businessName}}";
    default:
      return `Message from ${industrySlug}`;
  }
}

export function buildDefaultNotificationTemplates(
  industrySlug: WebsiteTemplateSlug,
  businessName: string,
): NotificationTemplate[] {
  const now = new Date().toISOString();

  return ALL_EVENTS.flatMap((eventType) => {
    const emailTemplate: NotificationTemplate = {
      id: generateId(eventType, NotificationChannel.EMAIL),
      industrySlug,
      eventType,
      channel: NotificationChannel.EMAIL,
      enabled: true,
      subject: getDefaultTemplateSubject(eventType, industrySlug).replace("{{businessName}}", businessName),
      body: getDefaultTemplateBody(eventType, NotificationChannel.EMAIL, industrySlug),
      tone: NotificationTemplateTone.PROFESSIONAL,
      variables: defaultVariablesForEvent(eventType),
      provider: "LOCAL",
      providerApprovalStatus: "NOT_SYNCED",
      createdAtIso: now,
      updatedAtIso: now,
    };

    const whatsappTemplate: NotificationTemplate = {
      id: generateId(eventType, NotificationChannel.WHATSAPP),
      industrySlug,
      eventType,
      channel: NotificationChannel.WHATSAPP,
      enabled: false,
      body: getDefaultTemplateBody(eventType, NotificationChannel.WHATSAPP, industrySlug),
      tone: NotificationTemplateTone.SHORT,
      variables: defaultVariablesForEvent(eventType),
      provider: "TWILIO",
      providerApprovalStatus: "NOT_SYNCED",
      createdAtIso: now,
      updatedAtIso: now,
    };

    return [emailTemplate, whatsappTemplate];
  });
}

