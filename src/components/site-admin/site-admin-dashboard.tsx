"use client";

import { useEffect, useState } from "react";
import type {
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";
import {
  getSiteAdminServices,
  getSiteAdminSettings,
  patchSiteAdminSettings,
  putSiteAdminServices,
} from "@/lib/sites/site-admin-client";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type SettingsDraft = {
  siteDisplayName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  openingHoursSummary: string;
  heroHeadline: string;
  heroSubheading: string;
  visualThemeId: string;
  colourPaletteId: string;
  currency: "GBP" | "EUR" | "USD";
};

type ServiceDraft = {
  id?: string;
  name: string;
  description: string;
  basePrice: string;
  durationMinutes: string;
  bufferAfterMinutes: string;
  active: boolean;
  sortOrder: string;
};

function toSettingsDraft(settings: PersistedCustomerSiteSettings | null): SettingsDraft {
  return {
    siteDisplayName: settings?.siteDisplayName ?? "",
    businessName: settings?.businessName ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    openingHoursSummary: settings?.openingHoursSummary ?? "",
    heroHeadline: settings?.heroHeadline ?? "",
    heroSubheading: settings?.heroSubheading ?? "",
    visualThemeId: settings?.visualThemeId ?? "",
    colourPaletteId: settings?.colourPaletteId ?? "",
    currency: (settings?.currency as "GBP" | "EUR" | "USD" | null) ?? "GBP",
  };
}

function toServiceDraft(service: PersistedCustomerSiteService): ServiceDraft {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    basePrice: service.basePrice === null ? "" : String(service.basePrice),
    durationMinutes: service.durationMinutes === null ? "" : String(service.durationMinutes),
    bufferAfterMinutes: service.bufferAfterMinutes === null ? "" : String(service.bufferAfterMinutes),
    active: service.active,
    sortOrder: String(service.sortOrder),
  };
}

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Access denied for this subscriber site.";
  }
  return `Request failed: ${error}`;
}

export function SiteAdminDashboard({ siteSlug }: { siteSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(() => toSettingsDraft(null));
  const [servicesDraft, setServicesDraft] = useState<ServiceDraft[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMessage(null);
      const [settingsResult, servicesResult] = await Promise.all([
        getSiteAdminSettings(siteSlug),
        getSiteAdminServices(siteSlug),
      ]);
      if (!active) return;

      if (!settingsResult.ok) {
        setMessage(toMessage(settingsResult.error, settingsResult.status));
        setLoading(false);
        return;
      }
      if (!servicesResult.ok) {
        setMessage(toMessage(servicesResult.error, servicesResult.status));
        setLoading(false);
        return;
      }
      setSettingsDraft(toSettingsDraft(settingsResult.settings));
      setServicesDraft(servicesResult.services.map(toServiceDraft));
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [siteSlug]);

  async function saveSettings() {
    setMessage("Saving site settings...");
    const result = await patchSiteAdminSettings(siteSlug, {
      siteDisplayName: settingsDraft.siteDisplayName || null,
      businessName: settingsDraft.businessName || null,
      phone: settingsDraft.phone || null,
      email: settingsDraft.email || null,
      address: settingsDraft.address || null,
      openingHoursSummary: settingsDraft.openingHoursSummary || null,
      heroHeadline: settingsDraft.heroHeadline || null,
      heroSubheading: settingsDraft.heroSubheading || null,
      visualThemeId: settingsDraft.visualThemeId || null,
      colourPaletteId: settingsDraft.colourPaletteId || null,
      currency: settingsDraft.currency,
    });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setSettingsDraft(toSettingsDraft(result.settings));
    setMessage("Site settings saved.");
  }

  async function saveServices() {
    setMessage("Saving services...");
    const result = await putSiteAdminServices(
      siteSlug,
      servicesDraft.map((service, index) => ({
        id: service.id,
        name: service.name.trim(),
        description: service.description.trim() || null,
        basePrice: service.basePrice.trim() ? Number(service.basePrice) : null,
        durationMinutes: service.durationMinutes.trim() ? Number(service.durationMinutes) : null,
        bufferAfterMinutes: service.bufferAfterMinutes.trim()
          ? Number(service.bufferAfterMinutes)
          : null,
        active: service.active,
        sortOrder: service.sortOrder.trim() ? Number(service.sortOrder) : index,
        rolePriceOverrides: null,
      })),
    );
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setServicesDraft(result.services.map(toServiceDraft));
    setMessage("Services saved.");
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading subscriber site admin data...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Business admin area</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tenant-scoped business-owner access. You can only edit this subscriber site.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Site settings</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Site display name
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.siteDisplayName} onChange={(event) => setSettingsDraft((current) => ({ ...current, siteDisplayName: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Business name
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.businessName} onChange={(event) => setSettingsDraft((current) => ({ ...current, businessName: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Phone
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.phone} onChange={(event) => setSettingsDraft((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Email
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.email} onChange={(event) => setSettingsDraft((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Address
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.address} onChange={(event) => setSettingsDraft((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Opening hours summary
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.openingHoursSummary} onChange={(event) => setSettingsDraft((current) => ({ ...current, openingHoursSummary: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero headline
            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroHeadline} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroHeadline: event.target.value }))} />
          </label>
        </div>
        <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveSettings()}>
          Save site settings
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Services</h3>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={() =>
              setServicesDraft((current) => [
                ...current,
                {
                  name: "",
                  description: "",
                  basePrice: "",
                  durationMinutes: "",
                  bufferAfterMinutes: "",
                  active: true,
                  sortOrder: String(current.length),
                },
              ])
            }
          >
            Add service
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {servicesDraft.length === 0 ? (
            <p className="text-sm text-slate-600">No services yet.</p>
          ) : (
            servicesDraft.map((service, index) => (
              <div key={`${service.id ?? "new"}-${index}`} className="rounded-xl border border-slate-200 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700">Service name
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={service.name} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Base price
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={service.basePrice} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, basePrice: event.target.value } : row))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Duration (minutes)
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={service.durationMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, durationMinutes: event.target.value } : row))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Buffer after service (minutes)
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={service.bufferAfterMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, bufferAfterMinutes: event.target.value } : row))} />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description
                    <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={service.description} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} />
                  </label>
                </div>
                <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setServicesDraft((current) => current.filter((_, i) => i !== index))}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveServices()}>
          Save services
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Other modules</h3>
        <p className="mt-2 text-sm text-slate-600">
          Staff, scheduling, pages, policies, vouchers, and bookings management in this business-owner
          area will be expanded in the next pass.
        </p>
      </section>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
