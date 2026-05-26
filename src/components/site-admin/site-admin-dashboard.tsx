"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PersistedCustomerSiteService,
  PersistedCustomerSiteSettings,
} from "@/lib/sites/admin-site-settings-client";
import {
  getSiteAdminServices,
  getSiteAdminSettings,
  patchSiteAdminSettings,
  putSiteAdminServices,
  listSiteAdminStaffRoles,
  saveSiteAdminStaffRoles,
  listSiteAdminStaff,
  saveSiteAdminStaff,
  getSiteAdminScheduling,
  saveSiteAdminScheduling,
  listSiteAdminBookings,
  removeSiteAdminBrandingFavicon,
  removeSiteAdminBrandingLogo,
  uploadSiteAdminBrandingFavicon,
  uploadSiteAdminBrandingLogo,
} from "@/lib/sites/site-admin-client";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import type {
  CustomerSiteStaffMemberRecord,
  CustomerSiteStaffRoleRecord,
  WeekdayValue,
} from "@/lib/sites/customer-site-staff-types";
import type {
  CustomerSiteBusinessClosureRecord,
  CustomerSiteStaffBreakWindowRecord,
  CustomerSiteStaffHolidayRecord,
  CustomerSiteStaffRotaDayRecord,
} from "@/lib/sites/customer-site-scheduling-types";
import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";

type SectionKey =
  | "settings"
  | "services"
  | "staffRoles"
  | "rotaBreaks"
  | "closuresHolidays"
  | "bookings";

const SECTION_LIST: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: "settings", label: "Site settings", description: "Business contact and hero basics" },
  { key: "services", label: "Services", description: "Service list, prices and durations" },
  { key: "staffRoles", label: "Staff & roles", description: "Team roles and member setup" },
  { key: "rotaBreaks", label: "Rota & breaks", description: "Weekly rota and break windows" },
  { key: "closuresHolidays", label: "Closures & holidays", description: "Business closures and staff leave" },
  { key: "bookings", label: "Bookings summary", description: "Recent live site booking records" },
];

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

type StaffRoleDraft = {
  id?: string;
  label: string;
  platformRole: string;
  active: boolean;
  sortOrder: string;
};

type StaffMemberDraft = {
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

type RotaDayDraft = {
  id?: string;
  staffMemberId: string;
  weekday: WeekdayValue;
  working: boolean;
  startTime: string;
  endTime: string;
};

type BreakWindowDraft = {
  id?: string;
  staffMemberId: string;
  rotaDayId?: string;
  weekday: WeekdayValue;
  label: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type BusinessClosureDraft = {
  id?: string;
  date: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
};

type StaffHolidayDraft = {
  id?: string;
  staffMemberId: string;
  date: string;
  label: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  active: boolean;
};

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Access denied for this subscriber site.";
  }
  if (error === "SITE_NOT_FOUND" || status === 404) {
    return "Subscriber site was not found for this login session.";
  }
  if (error === "STORAGE_NOT_CONFIGURED") {
    return "Branding storage is not configured in this environment yet.";
  }
  if (error === "FILE_TOO_LARGE") {
    return "Selected file is too large for this upload type.";
  }
  if (error === "UNSUPPORTED_MEDIA_TYPE") {
    return "File type is not supported for this upload type.";
  }
  return `Request failed: ${error}`;
}

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

function toRoleDraft(role: CustomerSiteStaffRoleRecord): StaffRoleDraft {
  return {
    id: role.id,
    label: role.label,
    platformRole: role.platformRole ?? "",
    active: role.active,
    sortOrder: String(role.sortOrder),
  };
}

function toStaffDraft(staff: CustomerSiteStaffMemberRecord): StaffMemberDraft {
  return {
    id: staff.id,
    roleId: staff.roleId ?? "",
    displayName: staff.displayName,
    roleLabel: staff.roleLabel ?? "",
    email: staff.email ?? "",
    phone: staff.phone ?? "",
    bio: staff.bio ?? "",
    active: staff.active,
    customerSelectable: staff.customerSelectable,
    isSuperUser: staff.isSuperUser,
    availableWeekdays: staff.availableWeekdays ?? [],
    notes: staff.notes ?? "",
    sortOrder: String(staff.sortOrder),
  };
}

function toRotaDayDraft(day: CustomerSiteStaffRotaDayRecord): RotaDayDraft {
  return {
    id: day.id,
    staffMemberId: day.staffMemberId,
    weekday: day.weekday,
    working: day.working,
    startTime: day.startTime ?? "",
    endTime: day.endTime ?? "",
  };
}

function toBreakWindowDraft(window: CustomerSiteStaffBreakWindowRecord): BreakWindowDraft {
  return {
    id: window.id,
    staffMemberId: window.staffMemberId,
    rotaDayId: window.rotaDayId ?? undefined,
    weekday: window.weekday,
    label: window.label ?? "",
    startTime: window.startTime,
    endTime: window.endTime,
    active: window.active,
  };
}

function toBusinessClosureDraft(closure: CustomerSiteBusinessClosureRecord): BusinessClosureDraft {
  return {
    id: closure.id,
    date: closure.date,
    label: closure.label,
    allDay: closure.allDay,
    startTime: closure.startTime ?? "",
    endTime: closure.endTime ?? "",
    active: closure.active,
  };
}

function toStaffHolidayDraft(holiday: CustomerSiteStaffHolidayRecord): StaffHolidayDraft {
  return {
    id: holiday.id,
    staffMemberId: holiday.staffMemberId,
    date: holiday.date,
    label: holiday.label,
    allDay: holiday.allDay,
    startTime: holiday.startTime ?? "",
    endTime: holiday.endTime ?? "",
    active: holiday.active,
  };
}

export function SiteAdminDashboard({ siteSlug }: { siteSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("settings");

  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(() => toSettingsDraft(null));
  const [persistedSettings, setPersistedSettings] = useState<PersistedCustomerSiteSettings | null>(null);
  const [servicesDraft, setServicesDraft] = useState<ServiceDraft[]>([]);
  const [rolesDraft, setRolesDraft] = useState<StaffRoleDraft[]>([]);
  const [staffDraft, setStaffDraft] = useState<StaffMemberDraft[]>([]);
  const [rotaDaysDraft, setRotaDaysDraft] = useState<RotaDayDraft[]>([]);
  const [breakWindowsDraft, setBreakWindowsDraft] = useState<BreakWindowDraft[]>([]);
  const [businessClosuresDraft, setBusinessClosuresDraft] = useState<BusinessClosureDraft[]>([]);
  const [staffHolidaysDraft, setStaffHolidaysDraft] = useState<StaffHolidayDraft[]>([]);
  const [bookings, setBookings] = useState<CustomerSiteBookingRecord[]>([]);
  const [selectedSchedulingStaffId, setSelectedSchedulingStaffId] = useState("");

  const selectedStaff = useMemo(
    () => staffDraft.find((item) => item.id === selectedSchedulingStaffId) ?? null,
    [selectedSchedulingStaffId, staffDraft],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setMessage(null);
      const [
        settingsResult,
        servicesResult,
        rolesResult,
        staffResult,
        schedulingResult,
        bookingsResult,
      ] = await Promise.all([
        getSiteAdminSettings(siteSlug),
        getSiteAdminServices(siteSlug),
        listSiteAdminStaffRoles(siteSlug),
        listSiteAdminStaff(siteSlug),
        getSiteAdminScheduling(siteSlug),
        listSiteAdminBookings(siteSlug, 25),
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
      if (!rolesResult.ok) {
        setMessage(toMessage(rolesResult.error, rolesResult.status));
        setLoading(false);
        return;
      }
      if (!staffResult.ok) {
        setMessage(toMessage(staffResult.error, staffResult.status));
        setLoading(false);
        return;
      }
      if (!schedulingResult.ok) {
        setMessage(toMessage(schedulingResult.error, schedulingResult.status));
        setLoading(false);
        return;
      }
      if (!bookingsResult.ok) {
        setMessage(toMessage(bookingsResult.error, bookingsResult.status));
        setLoading(false);
        return;
      }

      setSettingsDraft(toSettingsDraft(settingsResult.settings));
      setPersistedSettings(settingsResult.settings);
      setServicesDraft(servicesResult.services.map(toServiceDraft));
      setRolesDraft(rolesResult.roles.map(toRoleDraft));
      setStaffDraft(staffResult.staff.map(toStaffDraft));
      setRotaDaysDraft(schedulingResult.scheduling.rotaDays.map(toRotaDayDraft));
      setBreakWindowsDraft(schedulingResult.scheduling.breakWindows.map(toBreakWindowDraft));
      setBusinessClosuresDraft(schedulingResult.scheduling.businessClosures.map(toBusinessClosureDraft));
      setStaffHolidaysDraft(schedulingResult.scheduling.staffHolidays.map(toStaffHolidayDraft));
      setBookings(bookingsResult.bookings);
      setSelectedSchedulingStaffId(
        staffResult.staff[0]?.id ??
          schedulingResult.scheduling.rotaDays[0]?.staffMemberId ??
          schedulingResult.scheduling.staffHolidays[0]?.staffMemberId ??
          "",
      );
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
    setPersistedSettings(result.settings);
    setMessage("Site settings saved.");
  }

  async function uploadLogo(file: File) {
    setMessage("Uploading logo...");
    const result = await uploadSiteAdminBrandingLogo(siteSlug, file);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Logo uploaded.");
  }

  async function removeLogo() {
    setMessage("Removing logo...");
    const result = await removeSiteAdminBrandingLogo(siteSlug);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Logo removed.");
  }

  async function uploadFavicon(file: File) {
    setMessage("Uploading favicon...");
    const result = await uploadSiteAdminBrandingFavicon(siteSlug, file);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Favicon uploaded.");
  }

  async function removeFavicon() {
    setMessage("Removing favicon...");
    const result = await removeSiteAdminBrandingFavicon(siteSlug);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setPersistedSettings(result.settings);
    setMessage("Favicon removed.");
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

  async function saveStaffAndRoles() {
    setMessage("Saving staff roles...");
    const rolesResult = await saveSiteAdminStaffRoles(
      siteSlug,
      rolesDraft.map((role, index) => ({
        id: role.id,
        label: role.label.trim(),
        platformRole: role.platformRole.trim() || null,
        active: role.active,
        sortOrder: role.sortOrder.trim() ? Number(role.sortOrder) : index,
      })),
    );
    if (!rolesResult.ok) {
      setMessage(toMessage(rolesResult.error, rolesResult.status));
      return;
    }

    setMessage("Saving staff...");
    const staffResult = await saveSiteAdminStaff(
      siteSlug,
      staffDraft.map((staff, index) => ({
        id: staff.id,
        roleId: staff.roleId.trim() || null,
        displayName: staff.displayName.trim(),
        roleLabel: staff.roleLabel.trim() || null,
        email: staff.email.trim() || null,
        phone: staff.phone.trim() || null,
        bio: staff.bio.trim() || null,
        active: staff.active,
        customerSelectable: staff.customerSelectable,
        isSuperUser: staff.isSuperUser,
        availableWeekdays: staff.availableWeekdays,
        notes: staff.notes.trim() || null,
        sortOrder: staff.sortOrder.trim() ? Number(staff.sortOrder) : index,
      })),
    );
    if (!staffResult.ok) {
      setMessage(toMessage(staffResult.error, staffResult.status));
      return;
    }

    setRolesDraft(rolesResult.roles.map(toRoleDraft));
    setStaffDraft(staffResult.staff.map(toStaffDraft));
    if (!selectedSchedulingStaffId && staffResult.staff[0]?.id) {
      setSelectedSchedulingStaffId(staffResult.staff[0].id);
    }
    setMessage("Staff roles and staff members saved.");
  }

  async function saveScheduling() {
    setMessage("Saving scheduling...");
    const result = await saveSiteAdminScheduling(siteSlug, {
      rotaDays: rotaDaysDraft.map((day) => ({
        id: day.id,
        staffMemberId: day.staffMemberId,
        weekday: day.weekday,
        working: day.working,
        startTime: day.startTime.trim() || null,
        endTime: day.endTime.trim() || null,
      })),
      breakWindows: breakWindowsDraft.map((window) => ({
        id: window.id,
        staffMemberId: window.staffMemberId,
        rotaDayId: window.rotaDayId ?? null,
        weekday: window.weekday,
        label: window.label.trim() || null,
        startTime: window.startTime.trim(),
        endTime: window.endTime.trim(),
        active: window.active,
      })),
      businessClosures: businessClosuresDraft.map((closure) => ({
        id: closure.id,
        date: closure.date.trim(),
        label: closure.label.trim(),
        allDay: closure.allDay,
        startTime: closure.startTime.trim() || null,
        endTime: closure.endTime.trim() || null,
        active: closure.active,
      })),
      staffHolidays: staffHolidaysDraft.map((holiday) => ({
        id: holiday.id,
        staffMemberId: holiday.staffMemberId,
        date: holiday.date.trim(),
        label: holiday.label.trim(),
        allDay: holiday.allDay,
        startTime: holiday.startTime.trim() || null,
        endTime: holiday.endTime.trim() || null,
        active: holiday.active,
      })),
    });
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setRotaDaysDraft(result.scheduling.rotaDays.map(toRotaDayDraft));
    setBreakWindowsDraft(result.scheduling.breakWindows.map(toBreakWindowDraft));
    setBusinessClosuresDraft(result.scheduling.businessClosures.map(toBusinessClosureDraft));
    setStaffHolidaysDraft(result.scheduling.staffHolidays.map(toStaffHolidayDraft));
    setMessage("Scheduling saved.");
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading business admin data...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">This is your business admin area</h2>
        <p className="mt-2 text-sm text-slate-600">
          Manage the live data for your subscriber site. Your account is tenant-scoped to this site only.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_LIST.map((section) => {
            const active = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                className={`rounded-xl border px-3 py-3 text-left ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                }`}
                onClick={() => setActiveSection(section.key)}
              >
                <p className="text-sm font-semibold">{section.label}</p>
                <p className={`mt-1 text-xs ${active ? "text-slate-200" : "text-slate-600"}`}>
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection === "settings" ? (
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
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero subheading
              <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={settingsDraft.heroSubheading} onChange={(event) => setSettingsDraft((current) => ({ ...current, heroSubheading: event.target.value }))} />
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Business logo</h4>
              <p className="mt-1 text-xs text-slate-600">
                Recommended PNG or SVG. 512 x 512 px square icon or 1200 x 400 px wide logo. Max 1MB.
              </p>
              {persistedSettings?.logoUrl ? (
                <img
                  src={persistedSettings.logoUrl}
                  alt={persistedSettings.logoFileName ?? "Business logo"}
                  className="mt-2 h-16 w-auto max-w-full rounded-md border border-slate-200 bg-white p-1"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-600">No logo uploaded yet.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
                  Upload logo
                  <input
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadLogo(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {persistedSettings?.logoUrl ? (
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void removeLogo()}>
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Favicon</h4>
              <p className="mt-1 text-xs text-slate-600">
                Recommended PNG or ICO. 512 x 512 px source. Max 512KB.
              </p>
              {persistedSettings?.faviconUrl ? (
                <img
                  src={persistedSettings.faviconUrl}
                  alt={persistedSettings.faviconFileName ?? "Favicon"}
                  className="mt-2 h-10 w-10 rounded-md border border-slate-200 bg-white p-1"
                />
              ) : (
                <p className="mt-2 text-xs text-slate-600">No favicon uploaded yet.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
                  Upload favicon
                  <input
                    type="file"
                    accept=".png,.ico,.svg,image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFavicon(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {persistedSettings?.faviconUrl ? (
                  <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void removeFavicon()}>
                    Remove favicon
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveSettings()}>
            Save site settings
          </button>
        </section>
      ) : null}

      {activeSection === "services" ? (
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
            {servicesDraft.map((service, index) => (
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
            ))}
            {servicesDraft.length === 0 ? <p className="text-sm text-slate-600">No services yet.</p> : null}
          </div>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveServices()}>
            Save services
          </button>
        </section>
      ) : null}

      {activeSection === "staffRoles" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Staff & roles</h3>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Roles</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setRolesDraft((current) => [...current, { label: "", platformRole: "", active: true, sortOrder: String(current.length) }])}>Add role</button>
              </div>
              <div className="mt-2 space-y-2">
                {rolesDraft.map((role, index) => (
                  <div key={`${role.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Role label" value={role.label} onChange={(event) => setRolesDraft((current) => current.map((item, i) => i === index ? { ...item, label: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Platform role label" value={role.platformRole} onChange={(event) => setRolesDraft((current) => current.map((item, i) => i === index ? { ...item, platformRole: event.target.value } : item))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={role.active} onChange={(event) => setRolesDraft((current) => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} />
                        Active
                      </label>
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setRolesDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Staff members</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setStaffDraft((current) => [...current, { roleId: "", displayName: "", roleLabel: "", email: "", phone: "", bio: "", active: true, customerSelectable: false, isSuperUser: false, availableWeekdays: [], notes: "", sortOrder: String(current.length) }])}>Add staff</button>
              </div>
              <div className="mt-2 space-y-2">
                {staffDraft.map((staff, index) => (
                  <div key={`${staff.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Display name" value={staff.displayName} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, displayName: event.target.value } : item))} />
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={staff.roleId} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, roleId: event.target.value } : item))}>
                        <option value="">Select role</option>
                        {rolesDraft.map((role, roleIndex) => (
                          <option key={`${role.id ?? "new"}-${roleIndex}`} value={role.id ?? ""}>{role.label || "Unnamed role"}</option>
                        ))}
                      </select>
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Email" value={staff.email} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, email: event.target.value } : item))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Phone" value={staff.phone} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, phone: event.target.value } : item))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={staff.active} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={staff.customerSelectable} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, customerSelectable: event.target.checked } : item))} />
                        Customer selectable
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={staff.isSuperUser} onChange={(event) => setStaffDraft((current) => current.map((item, i) => i === index ? { ...item, isSuperUser: event.target.checked } : item))} />
                        Super user
                      </label>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-slate-700">Available weekdays</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {weekdayValues.map((weekday) => {
                            const checked = staff.availableWeekdays.includes(weekday);
                            return (
                              <label key={weekday} className="flex items-center gap-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) =>
                                    setStaffDraft((current) =>
                                      current.map((item, i) => {
                                        if (i !== index) return item;
                                        const next = new Set(item.availableWeekdays);
                                        if (event.target.checked) next.add(weekday);
                                        else next.delete(weekday);
                                        return { ...item, availableWeekdays: [...next] as WeekdayValue[] };
                                      }),
                                    )
                                  }
                                />
                                {weekdayLabel(weekday)}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setStaffDraft((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveStaffAndRoles()}>
            Save staff & roles
          </button>
        </section>
      ) : null}

      {activeSection === "rotaBreaks" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Rota & breaks</h3>
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={selectedSchedulingStaffId} onChange={(event) => setSelectedSchedulingStaffId(event.target.value)}>
              <option value="">Select staff member</option>
              {staffDraft.map((staff, index) => (
                <option key={`${staff.id ?? "new"}-${index}`} value={staff.id ?? ""}>
                  {staff.displayName || "Unnamed staff"}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Weekly rota</p>
              <div className="mt-2 space-y-2">
                {weekdayValues.map((weekday) => {
                  const allowed = selectedStaff ? selectedStaff.availableWeekdays.includes(weekday) : true;
                  const existing = rotaDaysDraft.find((day) => day.staffMemberId === selectedSchedulingStaffId && day.weekday === weekday);
                  const row = existing ?? {
                    staffMemberId: selectedSchedulingStaffId,
                    weekday,
                    working: false,
                    startTime: "",
                    endTime: "",
                  };
                  return (
                    <div key={weekday} className={`rounded-md border p-2 ${allowed ? "border-slate-200 bg-slate-50" : "border-amber-300 bg-amber-50"}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="w-24 text-xs font-semibold text-slate-800">{weekdayLabel(weekday)}</p>
                        <label className="flex items-center gap-1 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={row.working}
                            disabled={!selectedSchedulingStaffId || !allowed}
                            onChange={(event) => {
                              if (!selectedSchedulingStaffId) return;
                              const next = { ...row, working: event.target.checked };
                              setRotaDaysDraft((current) => {
                                const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                                return [...without, next];
                              });
                            }}
                          />
                          Working
                        </label>
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="09:00"
                          value={row.startTime}
                          disabled={!row.working || !selectedSchedulingStaffId || !allowed}
                          onChange={(event) => {
                            if (!selectedSchedulingStaffId) return;
                            const next = { ...row, startTime: event.target.value };
                            setRotaDaysDraft((current) => {
                              const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                              return [...without, next];
                            });
                          }}
                        />
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                          placeholder="17:00"
                          value={row.endTime}
                          disabled={!row.working || !selectedSchedulingStaffId || !allowed}
                          onChange={(event) => {
                            if (!selectedSchedulingStaffId) return;
                            const next = { ...row, endTime: event.target.value };
                            setRotaDaysDraft((current) => {
                              const without = current.filter((item) => !(item.staffMemberId === selectedSchedulingStaffId && item.weekday === weekday));
                              return [...without, next];
                            });
                          }}
                        />
                      </div>
                      {!allowed ? (
                        <p className="mt-1 text-xs text-amber-800">This staff member is not available on this day.</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Break windows</p>
                <button
                  type="button"
                  className={`${outlineButtonClass} ${smallButtonClass}`}
                  onClick={() =>
                    setBreakWindowsDraft((current) => [
                      ...current,
                      {
                        staffMemberId: selectedSchedulingStaffId || "",
                        weekday: "monday",
                        label: "",
                        startTime: "12:00",
                        endTime: "13:00",
                        active: true,
                      },
                    ])
                  }
                >
                  Add break
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {breakWindowsDraft.map((window, index) => (
                  <div key={`${window.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.staffMemberId} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                        <option value="">Select staff</option>
                        {staffDraft.map((staff, staffIndex) => (
                          <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                        ))}
                      </select>
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.weekday} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, weekday: event.target.value as WeekdayValue } : row))}>
                        {weekdayValues.map((weekday) => (
                          <option key={weekday} value={weekday}>{weekdayLabel(weekday)}</option>
                        ))}
                      </select>
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" placeholder="Break label" value={window.label} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="12:00" value={window.startTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="13:00" value={window.endTime} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={window.active} onChange={(event) => setBreakWindowsDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBreakWindowsDraft((current) => current.filter((_, i) => i !== index))}>
                      Remove
                    </button>
                  </div>
                ))}
                {breakWindowsDraft.length === 0 ? <p className="text-sm text-slate-600">No break windows yet.</p> : null}
              </div>
            </div>
          </div>

          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveScheduling()}>
            Save scheduling
          </button>
        </section>
      ) : null}

      {activeSection === "closuresHolidays" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Closures & holidays</h3>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Business closures</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setBusinessClosuresDraft((current) => [...current, { date: "", label: "", allDay: true, startTime: "", endTime: "", active: true }])}>
                  Add closure
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {businessClosuresDraft.map((closure, index) => (
                  <div key={`${closure.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="YYYY-MM-DD" value={closure.date} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value } : row))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Label" value={closure.label} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={closure.allDay} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, allDay: event.target.checked } : row))} />
                        All day
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={closure.active} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                      {!closure.allDay ? (
                        <>
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Start HH:mm" value={closure.startTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="End HH:mm" value={closure.endTime} onChange={(event) => setBusinessClosuresDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                        </>
                      ) : null}
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setBusinessClosuresDraft((current) => current.filter((_, i) => i !== index))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Staff holidays</p>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setStaffHolidaysDraft((current) => [...current, { staffMemberId: selectedSchedulingStaffId || "", date: "", label: "", allDay: true, startTime: "", endTime: "", active: true }])}>
                  Add holiday
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {staffHolidaysDraft.map((holiday, index) => (
                  <div key={`${holiday.id ?? "new"}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={holiday.staffMemberId} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, staffMemberId: event.target.value } : row))}>
                        <option value="">Select staff</option>
                        {staffDraft.map((staff, staffIndex) => (
                          <option key={`${staff.id ?? "new"}-${staffIndex}`} value={staff.id ?? ""}>{staff.displayName || "Unnamed staff"}</option>
                        ))}
                      </select>
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="YYYY-MM-DD" value={holiday.date} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, date: event.target.value } : row))} />
                      <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" placeholder="Label" value={holiday.label} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, label: event.target.value } : row))} />
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={holiday.allDay} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, allDay: event.target.checked } : row))} />
                        All day
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input type="checkbox" checked={holiday.active} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, active: event.target.checked } : row))} />
                        Active
                      </label>
                      {!holiday.allDay ? (
                        <>
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Start HH:mm" value={holiday.startTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, startTime: event.target.value } : row))} />
                          <input className="rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="End HH:mm" value={holiday.endTime} onChange={(event) => setStaffHolidaysDraft((current) => current.map((row, i) => i === index ? { ...row, endTime: event.target.value } : row))} />
                        </>
                      ) : null}
                    </div>
                    <button type="button" className="mt-2 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50" onClick={() => setStaffHolidaysDraft((current) => current.filter((_, i) => i !== index))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="button" className={`mt-4 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveScheduling()}>
            Save closures & holidays
          </button>
        </section>
      ) : null}

      {activeSection === "bookings" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Bookings summary (read-only)</h3>
          <p className="mt-1 text-sm text-slate-600">
            Upcoming and recent bookings for your site. Full booking management will be expanded in a later pass.
          </p>
          <div className="mt-3 space-y-2">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-600">No bookings found yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{booking.customerName}</p>
                  <p>
                    {booking.serviceName ?? "Service not set"} | {booking.preferredDate ?? "Date not set"}{" "}
                    {booking.preferredTime ?? ""}
                  </p>
                  <p>Staff: {booking.staffName ?? "Unassigned"}</p>
                  <p>Status: {booking.status}</p>
                  <p>Payment status: {booking.paymentStatus ?? "Not set"}</p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
