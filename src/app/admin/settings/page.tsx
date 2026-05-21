"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AvailabilityEditor } from "@/components/calendar/availability-editor";
import { CalendarPreview } from "@/components/calendar/calendar-preview";
import { HolidaysClosuresEditor } from "@/components/calendar/holidays-closures-editor";
import { NotificationTemplateEditor } from "@/components/notifications/notification-template-editor";
import { ServiceEditor } from "@/components/sites/service-editor";
import { PaymentPolicyEditor } from "@/components/sites/payment-policy-editor";
import { SiteSettingsSummary } from "@/components/sites/site-settings-summary";
import { StaffEditor } from "@/components/staff/staff-editor";
import { StaffRoleEditor } from "@/components/staff/staff-role-editor";
import { StaffRotaEditor } from "@/components/calendar/staff-rota-editor";
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
import {
  resetLocalStaffRoles,
  saveLocalStaffRoles,
  seedLocalStaffRoles,
  StaffRoleDefinition,
} from "@/lib/staff/staff-role-settings";
import { StaffMember } from "@/lib/staff/staff-types";
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

function firstSlug(): WebsiteTemplateSlug {
  return WEBSITE_TEMPLATE_SLUGS[0];
}

type SettingsSection =
  | "analytics"
  | "site"
  | "services"
  | "staff"
  | "availability"
  | "rota"
  | "closures"
  | "calendar"
  | "notifications";

const sections: Array<{ id: SettingsSection; label: string }> = [
  { id: "analytics", label: "Analytics and financials" },
  { id: "site", label: "Standard site settings" },
  { id: "services", label: "Services / products / pricing" },
  { id: "staff", label: "Staff setup" },
  { id: "availability", label: "Availability & scheduling" },
  { id: "rota", label: "Staff rota & breaks" },
  { id: "closures", label: "Holidays and Closures" },
  { id: "calendar", label: "Calendar preview (mock)" },
  { id: "notifications", label: "Notification templates" },
];

export default function AdminSettingsPage() {
  const [selectedSlug, setSelectedSlug] = useState<WebsiteTemplateSlug>(firstSlug());
  const [settings, setSettings] = useState<CustomerSiteSettings | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRoleDefinition[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [statusText, setStatusText] = useState("Loaded local mock settings.");
  const [activeSection, setActiveSection] = useState<SettingsSection>("services");

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
    setRoles(seedLocalStaffRoles(slug));
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

  function updateRoles(nextRoles: StaffRoleDefinition[]) {
    const saved = saveLocalStaffRoles(selectedSlug, nextRoles);
    setRoles(saved);
    setStatusText("Staff roles saved locally.");
  }

  function updateNotificationTemplates(nextTemplates: NotificationTemplate[]) {
    const saved = saveLocalNotificationTemplates(selectedSlug, nextTemplates);
    setNotificationTemplates(saved);
    setStatusText("Notification templates saved locally.");
  }

  if (!settings && template) {
    const seededSettings = seedLocalCustomerSiteSettings(selectedSlug, template);
    const seededStaff = seedLocalStaff(
      selectedSlug,
      seededSettings.services.filter((service) => service.active).map((service) => ({ id: service.id })),
    );
    const seededRoles = seedLocalStaffRoles(selectedSlug);
    const seededTemplates = listLocalNotificationTemplates(
      selectedSlug,
      seededSettings.businessDetails.businessName,
    );
    setSettings(seededSettings);
    setStaff(seededStaff);
    setRoles(seededRoles);
    setNotificationTemplates(seededTemplates);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mock Admin Settings</h1>
          <p className="mt-2 text-slate-600">
            Local-only business settings editor split into focused sections.
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
              setRoles(resetLocalStaffRoles(selectedSlug));
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

      <div className="mt-6 flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? primaryButtonClass : outlineButtonClass}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {settings ? (
        <div className="mt-6">
          {activeSection === "analytics" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Analytics and financials</h2>
              <p className="mt-2 text-sm text-slate-600">
                Local mock analytics are available in <span className="font-medium">/admin</span>. The live version will track page views,
                enquiries, bookings, conversion, income, and payment status.
              </p>
            </section>
          ) : null}

          {activeSection === "site" ? <SiteSettingsSummary settings={settings} /> : null}
          {activeSection === "site" ? (
            <div className="mt-6">
              <PaymentPolicyEditor
                settings={settings}
                onChange={(next) => {
                  setSettings(next);
                  setStatusText("Payment/cancellation settings updated locally.");
                }}
              />
            </div>
          ) : null}

          {activeSection === "services" ? <ServiceEditor services={settings.services} roleDefinitions={roles} onChange={updateServices} /> : null}

          {activeSection === "staff" ? (
            <div className="space-y-6">
              <StaffRoleEditor
                roles={roles}
                onChange={updateRoles}
                onSeed={() => {
                  const seeded = seedLocalStaffRoles(selectedSlug);
                  setRoles(seeded);
                  setStatusText("Loaded sample staff roles.");
                }}
                onReset={() => {
                  const reset = resetLocalStaffRoles(selectedSlug);
                  setRoles(reset);
                  setStatusText("Reset staff roles to defaults.");
                }}
              />
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
                <StaffEditor staff={staff} services={settings.services} roleDefinitions={roles} onChange={updateStaff} />
              </section>
            </div>
          ) : null}

          {activeSection === "availability" ? (
            <AvailabilityEditor industrySlug={selectedSlug} staffMembers={staff} services={settings.services} />
          ) : null}

          {activeSection === "rota" ? (
            <StaffRotaEditor key={`rota_${selectedSlug}`} industrySlug={selectedSlug} staffMembers={staff} />
          ) : null}

          {activeSection === "closures" ? (
            <HolidaysClosuresEditor industrySlug={selectedSlug} staffMembers={staff} />
          ) : null}

          {activeSection === "calendar" ? (
            <CalendarPreview industrySlug={selectedSlug} staffMembers={staff} services={settings.services} />
          ) : null}

          {activeSection === "notifications" ? (
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
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-600">No settings available for this template.</p>
      )}
    </main>
  );
}

