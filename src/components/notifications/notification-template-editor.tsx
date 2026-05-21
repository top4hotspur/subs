"use client";

import { useMemo, useState } from "react";
import {
  NotificationChannel,
  NotificationEventType,
  NotificationPreviewContext,
  NotificationTemplate,
  NotificationTemplateTone,
} from "@/lib/notifications/notification-types";
import { renderNotificationPreview } from "@/lib/notifications/local-notification-templates";
import {
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import {
  notificationChannelLabel,
  notificationEventTypeLabel,
  notificationToneLabel,
} from "@/lib/ui/display-labels";

type NotificationTemplateEditorProps = {
  templates: NotificationTemplate[];
  businessName: string;
  whatsappAddonEnabled: boolean;
  onChange: (templates: NotificationTemplate[]) => void;
  onReset: () => void;
};

const tones = Object.values(NotificationTemplateTone);
const events = Object.values(NotificationEventType);

export function NotificationTemplateEditor({
  templates,
  businessName,
  whatsappAddonEnabled,
  onChange,
  onReset,
}: NotificationTemplateEditorProps) {
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>(NotificationChannel.EMAIL);
  const [previewContext, setPreviewContext] = useState<NotificationPreviewContext>({
    businessName,
    customerName: "Alex Johnson",
    serviceName: "Premium service",
    bookingDate: "2026-06-01",
    bookingTime: "14:00",
    staffName: "Taylor",
    websiteUrl: "https://www.myexperiment.club",
    reviewUrl: "https://www.myexperiment.club/review",
    nextBookingDate: "2026-06-15",
  });

  const grouped = useMemo(
    () =>
      events
        .map((eventType) => ({
          eventType,
          items: templates.filter((template) => template.eventType === eventType && template.channel === activeChannel),
        }))
        .filter((group) => group.items.length > 0),
    [templates, activeChannel],
  );

  function updateTemplate(templateId: string, patch: Partial<NotificationTemplate>) {
    onChange(
      templates.map((template) =>
        template.id === templateId
          ? { ...template, ...patch, updatedAtIso: new Date().toISOString() }
          : template,
      ),
    );
  }

  const whatsappLocked = activeChannel === NotificationChannel.WHATSAPP && !whatsappAddonEnabled;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Notification templates</h2>
          <p className="text-xs text-slate-600">Email notifications are included. WhatsApp templates apply only when the optional add-on is enabled.</p>
          <p className="mt-1 text-xs text-slate-500">No real sending happens here. This is preview/edit only.</p>
        </div>
        <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={onReset}>
          Reset templates
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={activeChannel === NotificationChannel.EMAIL ? primaryButtonClass : outlineButtonClass}
          onClick={() => setActiveChannel(NotificationChannel.EMAIL)}
        >
          Email
        </button>
        <button
          type="button"
          className={activeChannel === NotificationChannel.WHATSAPP ? primaryButtonClass : outlineButtonClass}
          onClick={() => setActiveChannel(NotificationChannel.WHATSAPP)}
        >
          WhatsApp
        </button>
      </div>

      {whatsappLocked ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          WhatsApp templates are visible for planning, but this channel is disabled until the WhatsApp add-on is enabled.
        </div>
      ) : null}

      <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
        <label className="text-xs text-slate-700">
          Preview customer
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={previewContext.customerName}
            onChange={(event) => setPreviewContext((c) => ({ ...c, customerName: event.target.value }))}
          />
        </label>
        <label className="text-xs text-slate-700">
          Preview service
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={previewContext.serviceName}
            onChange={(event) => setPreviewContext((c) => ({ ...c, serviceName: event.target.value }))}
          />
        </label>
        <label className="text-xs text-slate-700">
          Next booking date
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
            value={previewContext.nextBookingDate}
            onChange={(event) => setPreviewContext((c) => ({ ...c, nextBookingDate: event.target.value }))}
          />
        </label>
      </div>

      <div className="space-y-4">
        {grouped.map((group) => (
          <article key={group.eventType} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{notificationEventTypeLabel(group.eventType)}</h3>
            <div className="mt-3 space-y-3">
              {group.items.map((template) => (
                <div key={template.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${template.channel === "EMAIL" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {notificationChannelLabel(template.channel)}
                      </span>
                      <span className="text-xs text-slate-600">Tone: {notificationToneLabel(template.tone)}</span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={template.enabled}
                        disabled={whatsappLocked}
                        onChange={(event) => updateTemplate(template.id, { enabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>

                  {template.channel === "EMAIL" ? (
                    <label className="mt-2 block text-xs text-slate-700">
                      Subject
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={template.subject ?? ""}
                        onChange={(event) => updateTemplate(template.id, { subject: event.target.value })}
                      />
                    </label>
                  ) : null}

                  <label className="mt-2 block text-xs text-slate-700">
                    Body
                    <textarea
                      className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={template.body}
                      onChange={(event) => updateTemplate(template.id, { body: event.target.value })}
                    />
                  </label>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-slate-700">
                      Tone
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={template.tone}
                        onChange={(event) =>
                          updateTemplate(template.id, {
                            tone: event.target.value as NotificationTemplateTone,
                          })
                        }
                      >
                        {tones.map((tone) => (
                          <option key={tone} value={tone}>{notificationToneLabel(tone)}</option>
                        ))}
                      </select>
                    </label>
                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Variables</p>
                      <p className="mt-1">{template.variables.map((variable) => `{{${variable}}}`).join(", ")}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-700">Live preview</p>
                    {template.channel === "EMAIL" && template.subject ? (
                      <p className="mt-1 text-xs text-slate-700">
                        <span className="font-semibold">Subject:</span> {template.subject}
                      </p>
                    ) : null}
                    <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{renderNotificationPreview(template, { ...previewContext, businessName })}</pre>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <span className={`${secondaryButtonClass} ${smallButtonClass}`}>Email included</span>
        <span className={`${primaryButtonClass} ${smallButtonClass}`}>WhatsApp optional add-on</span>
      </div>
    </section>
  );
}
