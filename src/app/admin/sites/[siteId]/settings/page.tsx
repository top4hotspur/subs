"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { BusinessSiteSettingsShell } from "@/components/admin/business-site-settings-shell";
import { getAdminTenantSiteDetail } from "@/lib/sites/admin-sites-client";
import {
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
  getAdminSitePersistedServices,
  getAdminSitePersistedSettings,
  putAdminSitePersistedServices,
  patchAdminSitePersistedSettings,
} from "@/lib/sites/admin-site-settings-client";
import {
  deletePersistedStaffMember,
  deletePersistedStaffRole,
  listPersistedStaff,
  listPersistedStaffRoles,
  savePersistedStaff,
  savePersistedStaffRoles,
} from "@/lib/sites/admin-site-staff-client";
import type {
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleRecord,
  WeekdayValue,
} from "@/lib/sites/customer-site-staff-types";
import { SITE_VISUAL_TEMPLATES } from "@/lib/sites/site-visual-templates";
import { SITE_COLOUR_SCHEMES } from "@/lib/sites/site-colour-schemes";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatOptional } from "@/lib/ui/display-labels";

type PersistedSettingsDraft = {
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

type PersistedServiceDraft = {
  id?: string;
  name: string;
  description: string;
  basePrice: string;
  durationMinutes: string;
  bufferAfterMinutes: string;
  active: boolean;
  sortOrder: string;
  rolePriceOverrides: string;
};

type PersistedStaffRoleDraft = {
  id?: string;
  label: string;
  platformRole: string;
  active: boolean;
  sortOrder: string;
};

type PersistedStaffMemberDraft = {
  id?: string;
  roleId: string;
  displayName: string;
  roleLabel: string;
  email: string;
  phone: string;
  bio: string;
  active: boolean;
  customerSelectable: boolean;
  isSuperUser: boolean;
  availableWeekdays: WeekdayValue[];
  notes: string;
  sortOrder: string;
};

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Please sign in with a platform admin account.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while loading subscriber site detail.";
  }
  return `Could not load site detail: ${error}`;
}

function toSettingsDraft(record: PersistedCustomerSiteSettings | null): PersistedSettingsDraft {
  return {
    siteDisplayName: record?.siteDisplayName ?? "",
    businessName: record?.businessName ?? "",
    phone: record?.phone ?? "",
    email: record?.email ?? "",
    address: record?.address ?? "",
    openingHoursSummary: record?.openingHoursSummary ?? "",
    heroHeadline: record?.heroHeadline ?? "",
    heroSubheading: record?.heroSubheading ?? "",
    visualThemeId: record?.visualThemeId ?? "",
    colourPaletteId: record?.colourPaletteId ?? "",
    currency: (record?.currency as "GBP" | "EUR" | "USD" | null) ?? "GBP",
  };
}

function toServiceDraft(service: PersistedCustomerSiteService): PersistedServiceDraft {
  return {
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    basePrice: service.basePrice === null ? "" : String(service.basePrice),
    durationMinutes: service.durationMinutes === null ? "" : String(service.durationMinutes),
    bufferAfterMinutes: service.bufferAfterMinutes === null ? "" : String(service.bufferAfterMinutes),
    active: service.active,
    sortOrder: String(service.sortOrder),
    rolePriceOverrides:
      service.rolePriceOverrides === null || service.rolePriceOverrides === undefined
        ? ""
        : JSON.stringify(service.rolePriceOverrides),
  };
}

function emptyServiceDraft(sortOrder: number): PersistedServiceDraft {
  return {
    name: "",
    description: "",
    basePrice: "",
    durationMinutes: "",
    bufferAfterMinutes: "",
    active: true,
    sortOrder: String(sortOrder),
    rolePriceOverrides: "",
  };
}

const weekdayValues: WeekdayValue[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function weekdayLabel(weekday: WeekdayValue): string {
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function toStaffRoleDraft(role: CustomerSiteStaffRoleRecord): PersistedStaffRoleDraft {
  return {
    id: role.id,
    label: role.label,
    platformRole: role.platformRole ?? "",
    active: role.active,
    sortOrder: String(role.sortOrder),
  };
}

function emptyStaffRoleDraft(sortOrder: number): PersistedStaffRoleDraft {
  return {
    label: "",
    platformRole: "",
    active: true,
    sortOrder: String(sortOrder),
  };
}

function toStaffMemberDraft(member: CustomerSiteStaffMemberRecord): PersistedStaffMemberDraft {
  return {
    id: member.id,
    roleId: member.roleId ?? "",
    displayName: member.displayName,
    roleLabel: member.roleLabel ?? "",
    email: member.email ?? "",
    phone: member.phone ?? "",
    bio: member.bio ?? "",
    active: member.active,
    customerSelectable: member.customerSelectable,
    isSuperUser: member.isSuperUser,
    availableWeekdays: member.availableWeekdays ?? [],
    notes: member.notes ?? "",
    sortOrder: String(member.sortOrder),
  };
}

function emptyStaffMemberDraft(sortOrder: number): PersistedStaffMemberDraft {
  return {
    roleId: "",
    displayName: "",
    roleLabel: "",
    email: "",
    phone: "",
    bio: "",
    active: true,
    customerSelectable: false,
    isSuperUser: false,
    availableWeekdays: [],
    notes: "",
    sortOrder: String(sortOrder),
  };
}

export default function AdminSiteSettingsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = typeof params?.siteId === "string" ? params.siteId : "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [industrySlug, setIndustrySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<PersistedSettingsDraft>(() =>
    toSettingsDraft(null),
  );
  const [servicesDraft, setServicesDraft] = useState<PersistedServiceDraft[]>([]);
  const [staffRolesDraft, setStaffRolesDraft] = useState<PersistedStaffRoleDraft[]>([]);
  const [staffMembersDraft, setStaffMembersDraft] = useState<PersistedStaffMemberDraft[]>([]);

  const allowedPalettes = useMemo(() => {
    const theme = SITE_VISUAL_TEMPLATES.find((item) => item.id === settingsDraft.visualThemeId);
    if (!theme) return SITE_COLOUR_SCHEMES;
    return SITE_COLOUR_SCHEMES.filter((palette) => theme.allowedPalettes.includes(palette.id));
  }, [settingsDraft.visualThemeId]);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      if (!siteId) {
        setError("Missing site id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setMessage(null);

      const [detailResult, settingsResult, servicesResult, rolesResult, staffResult] = await Promise.all([
        getAdminTenantSiteDetail(siteId),
        getAdminSitePersistedSettings(siteId),
        getAdminSitePersistedServices(siteId),
        listPersistedStaffRoles(siteId),
        listPersistedStaff(siteId),
      ]);

      if (!active) return;

      if (!detailResult.ok) {
        setError(toMessage(detailResult.error, detailResult.status));
        setLoading(false);
        return;
      }

      setSiteName(detailResult.site.displayName);
      setIndustrySlug(detailResult.site.industrySlug ?? null);

      if (!settingsResult.ok) {
        setError(toMessage(settingsResult.error, settingsResult.status));
        setLoading(false);
        return;
      }
      if (!servicesResult.ok) {
        setError(toMessage(servicesResult.error, servicesResult.status));
        setLoading(false);
        return;
      }
      if (!rolesResult.ok) {
        setError(toMessage(rolesResult.error, rolesResult.status));
        setLoading(false);
        return;
      }
      if (!staffResult.ok) {
        setError(toMessage(staffResult.error, staffResult.status));
        setLoading(false);
        return;
      }

      setSettingsDraft(toSettingsDraft(settingsResult.settings));
      setServicesDraft(servicesResult.services.map(toServiceDraft));
      setStaffRolesDraft(rolesResult.roles.map(toStaffRoleDraft));
      setStaffMembersDraft(staffResult.staff.map(toStaffMemberDraft));
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [siteId]);

  async function savePersistedSettings(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted settings...");

    const result = await patchAdminSitePersistedSettings(siteId, {
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
    setMessage("Persisted site settings saved.");
  }

  async function savePersistedServices(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted services...");

    const payload = servicesDraft.map((service, index) => {
      let parsedOverrides: unknown = undefined;
      if (service.rolePriceOverrides.trim()) {
        try {
          parsedOverrides = JSON.parse(service.rolePriceOverrides);
        } catch {
          parsedOverrides = service.rolePriceOverrides;
        }
      }

      return {
        id: service.id,
        name: service.name.trim(),
        description: service.description.trim() || null,
        basePrice: service.basePrice.trim() ? Number(service.basePrice) : null,
        durationMinutes: service.durationMinutes.trim()
          ? Number(service.durationMinutes)
          : null,
        bufferAfterMinutes: service.bufferAfterMinutes.trim()
          ? Number(service.bufferAfterMinutes)
          : null,
        active: service.active,
        sortOrder: service.sortOrder.trim() ? Number(service.sortOrder) : index,
        rolePriceOverrides: parsedOverrides ?? null,
      };
    });

    const result = await putAdminSitePersistedServices(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setServicesDraft(result.services.map(toServiceDraft));
    setMessage("Persisted services saved.");
  }

  async function savePersistedStaffRolesSection(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted staff roles...");

    const payload = staffRolesDraft.map((role, index) => ({
      id: role.id,
      label: role.label.trim(),
      platformRole: role.platformRole.trim() || null,
      active: role.active,
      sortOrder: role.sortOrder.trim() ? Number(role.sortOrder) : index,
    }));

    const result = await savePersistedStaffRoles(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setStaffRolesDraft(result.roles.map(toStaffRoleDraft));
    setMessage("Persisted staff roles saved.");
  }

  async function savePersistedStaffMembersSection(): Promise<void> {
    if (!siteId) return;
    setMessage("Saving persisted staff members...");

    const payload = staffMembersDraft.map((member, index) => ({
      id: member.id,
      roleId: member.roleId.trim() || null,
      displayName: member.displayName.trim(),
      roleLabel: member.roleLabel.trim() || null,
      email: member.email.trim() || null,
      phone: member.phone.trim() || null,
      bio: member.bio.trim() || null,
      active: member.active,
      customerSelectable: member.customerSelectable,
      isSuperUser: member.isSuperUser,
      availableWeekdays: member.availableWeekdays,
      notes: member.notes.trim() || null,
      sortOrder: member.sortOrder.trim() ? Number(member.sortOrder) : index,
    }));

    const result = await savePersistedStaff(siteId, payload);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setStaffMembersDraft(result.staff.map(toStaffMemberDraft));
    setMessage("Persisted staff members saved.");
  }

  async function deleteRole(id?: string): Promise<void> {
    if (!siteId || !id) return;
    const result = await deletePersistedStaffRole(siteId, id);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setStaffRolesDraft((current) => current.filter((role) => role.id !== id));
    setStaffMembersDraft((current) =>
      current.map((member) => (member.roleId === id ? { ...member, roleId: "" } : member)),
    );
    setMessage("Staff role deleted. Linked staff role references were cleared.");
  }

  async function deleteStaff(id?: string): Promise<void> {
    if (!siteId || !id) return;
    const result = await deletePersistedStaffMember(siteId, id);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setStaffMembersDraft((current) => current.filter((member) => member.id !== id));
    setMessage("Staff member deleted.");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Persisted Subscriber Site Settings for {siteName ?? "Subscriber site"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Support/provisioning settings editor until subscriber admin auth is added.
          </p>
          {industrySlug ? (
            <p className="mt-1 text-sm text-slate-600">
              Linked subscriber industry: <span className="font-semibold">{formatOptional(industrySlug)}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/sites?siteId=${encodeURIComponent(siteId)}`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to subscriber site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      {loading ? <p className="mt-6 text-sm text-slate-600">Loading site detail...</p> : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          <div className="mt-3">
            <Link href="/admin/sites" className={`${outlineButtonClass} ${smallButtonClass}`}>
              Back to subscriber sites
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Persisted site settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              This is the first persisted settings area for this subscriber site. Staff, rota, pages, vouchers and policies are still local/demo only.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero subheading
                <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroSubheading} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroSubheading: event.target.value }))} />
              </label>
              <label className="text-xs font-semibold text-slate-700">Visual theme id
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.visualThemeId} onChange={(event) => setSettingsDraft((current) => ({ ...current, visualThemeId: event.target.value }))}>
                  <option value="">Not set</option>
                  {SITE_VISUAL_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">Colour palette id
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.colourPaletteId} onChange={(event) => setSettingsDraft((current) => ({ ...current, colourPaletteId: event.target.value }))}>
                  <option value="">Not set</option>
                  {allowedPalettes.map((palette) => (
                    <option key={palette.id} value={palette.id}>{palette.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">Currency
                <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.currency} onChange={(event) => setSettingsDraft((current) => ({ ...current, currency: event.target.value as "GBP" | "EUR" | "USD" }))}>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <div className="mt-4">
              <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedSettings}>
                Save persisted settings
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Persisted services</h2>
              <button
                type="button"
                className={`${outlineButtonClass} ${smallButtonClass}`}
                onClick={() => setServicesDraft((current) => [...current, emptyServiceDraft(current.length)])}
              >
                Add service row
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {servicesDraft.length === 0 ? (
                <p className="text-sm text-slate-600">No persisted services yet.</p>
              ) : (
                servicesDraft.map((service, index) => (
                  <div key={`${service.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">Service {index + 1}</p>
                      <button
                        type="button"
                        className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => setServicesDraft((current) => current.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-700">Name
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.name} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Base price
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.basePrice} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, basePrice: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Duration minutes
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.durationMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, durationMinutes: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Buffer after minutes
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.bufferAfterMinutes} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, bufferAfterMinutes: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Sort order
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.sortOrder} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                      </label>
                      <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={service.active} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description
                        <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={service.description} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, description: event.target.value } : row))} />
                      </label>
                      <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Role price overrides JSON (optional)
                        <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs" rows={2} value={service.rolePriceOverrides} onChange={(event) => setServicesDraft((current) => current.map((row, i) => i === index ? { ...row, rolePriceOverrides: event.target.value } : row))} />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedServices}>
                Save persisted services
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Persisted staff and roles</h2>
            <p className="mt-2 text-sm text-slate-600">
              Rota, breaks and holidays are still local/demo only and will be persisted in a later pass.
            </p>

            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Staff roles/positions</h3>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => setStaffRolesDraft((current) => [...current, emptyStaffRoleDraft(current.length)])}
                  >
                    Add role
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {staffRolesDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted roles yet.</p>
                  ) : (
                    staffRolesDraft.map((role, index) => (
                      <div key={`${role.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">Label
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.label} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Platform role
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.platformRole} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, platformRole: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Sort order
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={role.sortOrder} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                          </label>
                          <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={role.active} onChange={(event) => setStaffRolesDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              if (role.id) {
                                void deleteRole(role.id);
                              } else {
                                setStaffRolesDraft((current) => current.filter((_, i) => i !== index));
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedStaffRolesSection}>
                    Save persisted roles
                  </button>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Staff members</h3>
                  <button
                    type="button"
                    className={`${outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => setStaffMembersDraft((current) => [...current, emptyStaffMemberDraft(current.length)])}
                  >
                    Add staff member
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {staffMembersDraft.length === 0 ? (
                    <p className="text-sm text-slate-600">No persisted staff yet.</p>
                  ) : (
                    staffMembersDraft.map((member, index) => (
                      <div key={`${member.id ?? "new"}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-slate-700">Name
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.displayName} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, displayName: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Role
                            <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.roleId} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, roleId: event.target.value } : row))}>
                              <option value="">None</option>
                              {staffRolesDraft.map((role, roleIndex) => (
                                <option key={`${role.id ?? "new-role"}-${roleIndex}`} value={role.id ?? ""}>{role.label || "Untitled role"}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Role label fallback
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.roleLabel} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, roleLabel: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Email
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.email} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, email: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Phone
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.phone} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, phone: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700">Sort order
                            <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={member.sortOrder} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, sortOrder: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Bio
                            <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={member.bio} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, bio: event.target.value } : row))} />
                          </label>
                          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Notes
                            <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" rows={2} value={member.notes} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, notes: event.target.value } : row))} />
                          </label>
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-700">Available weekdays</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {weekdayValues.map((weekday) => (
                                <label key={weekday} className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={member.availableWeekdays.includes(weekday)}
                                    onChange={(event) => {
                                      setStaffMembersDraft((current) =>
                                        current.map((row, i) =>
                                          i === index
                                            ? {
                                                ...row,
                                                availableWeekdays: event.target.checked
                                                  ? [...row.availableWeekdays, weekday]
                                                  : row.availableWeekdays.filter((item) => item !== weekday),
                                              }
                                            : row,
                                        ),
                                      );
                                    }}
                                  />
                                  {weekdayLabel(weekday)}
                                </label>
                              ))}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.active} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                            Active
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.customerSelectable} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, customerSelectable: event.target.checked } : row))} />
                            Customer selectable
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input type="checkbox" checked={member.isSuperUser} onChange={(event) => setStaffMembersDraft((current) => current.map((row, i) => i === index ? { ...row, isSuperUser: event.target.checked } : row))} />
                            Super user
                          </label>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              if (member.id) {
                                void deleteStaff(member.id);
                              } else {
                                setStaffMembersDraft((current) => current.filter((_, i) => i !== index));
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3">
                  <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={savePersistedStaffMembersSection}>
                    Save persisted staff
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Demo/settings preview (local)</h2>
            <p className="mt-2 text-sm text-slate-600">
              This section remains browser-local demo data. It is separate from the persisted editor above.
            </p>
            <div className="mt-4">
              <BusinessSiteSettingsShell />
            </div>
          </section>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </div>
      ) : null}
    </main>
  );
}
