import { buildDefaultNotificationTemplates } from "@/lib/notifications/default-notification-templates";
import { NotificationPreviewContext, NotificationTemplate } from "@/lib/notifications/notification-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

function key(industrySlug: WebsiteTemplateSlug): string {
  return `subs-notification-templates:${industrySlug}`;
}

function parse(raw: string | null): NotificationTemplate[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as NotificationTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listLocalNotificationTemplates(
  industrySlug: WebsiteTemplateSlug,
  businessName: string,
): NotificationTemplate[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = parse(window.localStorage.getItem(key(industrySlug)));
  if (existing.length > 0) {
    return existing;
  }

  const defaults = buildDefaultNotificationTemplates(industrySlug, businessName);
  window.localStorage.setItem(key(industrySlug), JSON.stringify(defaults));
  return defaults;
}

export function saveLocalNotificationTemplates(
  industrySlug: WebsiteTemplateSlug,
  templates: NotificationTemplate[],
): NotificationTemplate[] {
  if (typeof window === "undefined") {
    return templates;
  }
  window.localStorage.setItem(key(industrySlug), JSON.stringify(templates));
  return templates;
}

export function updateLocalNotificationTemplate(
  industrySlug: WebsiteTemplateSlug,
  templateId: string,
  patch: Partial<NotificationTemplate>,
): NotificationTemplate[] {
  if (typeof window === "undefined") {
    return [];
  }

  const templates = parse(window.localStorage.getItem(key(industrySlug))).map((template) =>
    template.id === templateId
      ? {
          ...template,
          ...patch,
          updatedAtIso: new Date().toISOString(),
        }
      : template,
  );
  window.localStorage.setItem(key(industrySlug), JSON.stringify(templates));
  return templates;
}

export function resetLocalNotificationTemplates(
  industrySlug: WebsiteTemplateSlug,
  businessName: string,
): NotificationTemplate[] {
  const defaults = buildDefaultNotificationTemplates(industrySlug, businessName);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key(industrySlug), JSON.stringify(defaults));
  }
  return defaults;
}

export function renderNotificationPreview(
  template: NotificationTemplate,
  context: NotificationPreviewContext,
): string {
  const variableMap: Record<string, string> = {
    businessName: context.businessName,
    customerName: context.customerName,
    serviceName: context.serviceName ?? "[service name]",
    bookingDate: context.bookingDate ?? "[booking date]",
    bookingTime: context.bookingTime ?? "[booking time]",
    staffName: context.staffName ?? "[staff name]",
    websiteUrl: context.websiteUrl ?? "[website url]",
    reviewUrl: context.reviewUrl ?? "[review url]",
    nextBookingDate: context.nextBookingDate ?? "[next booking date]",
  };

  return template.body.replace(/\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g, (_, variable) => {
    return variableMap[variable] ?? `[${variable}]`;
  });
}

