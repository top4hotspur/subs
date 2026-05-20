"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AvailabilityEditor } from "@/components/calendar/availability-editor";
import { CalendarPreview } from "@/components/calendar/calendar-preview";
import { NotificationTemplateEditor } from "@/components/notifications/notification-template-editor";
import { ServiceEditor } from "@/components/sites/service-editor";
import { SiteSettingsSummary } from "@/components/sites/site-settings-summary";
import { StaffEditor } from "@/components/staff/staff-editor";
import {
  listLocalNotificationTemplates,
  resetLocalNotificationTemplates,
  saveLocalNotificationTemplates,
} from "@/lib/notifications/local-notification-templates";
import { NotificationTemplate } from "@/lib/notifications/notification-types";
import {
  getLocalCustomerSiteSettings,
  resetLocalCustomerSiteSettings,
  saveLocalCustomerSiteSettings,
  seedLocalCustomerSiteSettings,
  updateLocalSiteServices,
} from "@/lib/sites/local-site-settings";
import { getWebsiteTemplate, listWebsiteTemplates } from "@/lib/sites/mock-repository";
import { CustomerSiteSettings, SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WEBSITE_TEMPLATE_SLUGS, WebsiteTemplateSlug } from "@/lib/sites/types";
import { listLocalStaff, saveLocalStaff, seedLocalStaff } from "@/lib/staff/local-staff";
import { StaffMember } from "@/lib/staff/staff-types";
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

function firstSlug(): WebsiteTemplateSlug {
  return WEBSITE_TEMPLATE_SLUGS[0];
}

export default function AdminSettingsPage() {
  const [selectedSlug, setSelectedSlug] = useState<WebsiteTemplateSlug>(firstSlug());
  const [settings, setSettings] = useState<CustomerSiteSettings | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [statusText, setStatusText] = useState("Loaded local mock settings.");

  const templates = useMemo(() => listWebsiteTemplates(), []);

  const template = getWebsiteTemplate(selectedSlug);

  function load(slug: WebsiteTemplateSlug) {
    const selectedTemplate = getWebsiteTemplate(slug);
    if (!selectedTemplate) {
      return;
    }
    const loaded = getLocalCustomerSiteSettings(slug, selectedTemplate);
    setSettings(loaded);
    setStaff(listLocalStaff(slug));
    setNotificationTemplates(
      listLocalNotificationTemplates(slug, loaded.businessDetails.businessName),
    );
  }

  function updateServices(services: SiteServiceItem[]) {
    if (!template) {
      return;
    }
    const updated = updateLocalSiteServices(selectedSlug, template, services);
    setSettings(updated);
    setStatusText("Services saved locally.");
  }

  function updateStaff(nextStaff: StaffMember[]) {
    const saved = saveLocalStaff(selectedSlug, nextStaff);
    setStaff(saved);
    setStatusText("Staff saved locally.");
  }

  function updateNotificationTemplates(nextTemplates: NotificationTemplate[]) {
    const saved = saveLocalNotificationTemplates(selectedSlug, nextTemplates);
    setNotificationTemplates(saved);
    setStatusText("Notification templates saved locally.");
  }

  // initial lazy load
  if (!settings && template) {
    const seededSettings = seedLocalCustomerSiteSettings(selectedSlug, template);
    const seededStaff = seedLocalStaff(
      selectedSlug,
      seededSettings.services.filter((service) => service.active).map((service) => ({ id: service.id })),
    );
    const seededTemplates = listLocalNotificationTemplates(
      selectedSlug,
      seededSettings.businessDetails.businessName,
    );
    setSettings(seededSettings);
    setStaff(seededStaff);
    setNotificationTemplates(seededTemplates);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Admin Settings</h1>
          <p className="mt-2 text-slate-600">
            Local-only business settings editor for services/products/pricing and team configuration.
          </p>
        </div>
        <Link href="/admin" className={outlineButtonClass}>
          Back to admin
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
          <label className="text-sm font-medium text-slate-700">
            Industry / template
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={selectedSlug}
              onChange={(event) => {
                const slug = event.target.value as WebsiteTemplateSlug;
                setSelectedSlug(slug);
                load(slug);
              }}
            >
              {templates.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              if (!template) return;
              load(selectedSlug);
              setStatusText("Reloaded local settings.");
            }}
          >
            Reload
          </button>
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => {
              if (!template) return;
              const reset = resetLocalCustomerSiteSettings(selectedSlug, template);
              setSettings(reset);
              setStaff([]);
              setNotificationTemplates(
                resetLocalNotificationTemplates(selectedSlug, reset.businessDetails.businessName),
              );
              setStatusText("Reset to template defaults.");
            }}
          >
            Reset defaults
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              if (!settings) return;
              const saved = saveLocalCustomerSiteSettings(settings);
              setSettings(saved);
              setStatusText("Settings saved locally.");
            }}
          >
            Save settings
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-600">{statusText}</p>
        <p className="mt-2 text-xs text-slate-500">This page is browser-only local mock data.</p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Analytics and financials</h2>
        <p className="mt-2 text-sm text-slate-600">
          Local mock analytics are available in <span className="font-medium">/admin</span>. The live version will track page views,
          enquiries, bookings, conversion, income, and payment status.
        </p>
      </section>

      {settings ? (
        <div className="mt-6 space-y-6">
          <SiteSettingsSummary settings={settings} />
          <ServiceEditor services={settings.services} onChange={updateServices} />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Staff setup</h2>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  const seeded = seedLocalStaff(
                    selectedSlug,
                    settings.services.filter((service) => service.active).map((service) => ({ id: service.id })),
                  );
                  setStaff(seeded);
                  setStatusText("Loaded sample staff.");
                }}
              >
                Load sample staff
              </button>
            </div>
            <StaffEditor staff={staff} services={settings.services} onChange={updateStaff} />
          </section>

          <AvailabilityEditor industrySlug={selectedSlug} staffMembers={staff} services={settings.services} />
          <CalendarPreview industrySlug={selectedSlug} staffMembers={staff} services={settings.services} />

          <NotificationTemplateEditor
            templates={notificationTemplates}
            businessName={settings.businessDetails.businessName}
            whatsappAddonEnabled={settings.notifications.whatsappAddonEnabled}
            onChange={updateNotificationTemplates}
            onReset={() => {
              const reset = resetLocalNotificationTemplates(
                selectedSlug,
                settings.businessDetails.businessName,
              );
              setNotificationTemplates(reset);
              setStatusText("Notification templates reset.");
            }}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-600">No settings available for this template.</p>
      )}
    </main>
  );
}
