"use client";

import { ReactNode, useMemo, useState } from "react";
import { StaffRotaEditor } from "@/components/calendar/staff-rota-editor";
import { DemoAccessDetailsCard } from "@/components/demo/demo-access-details-card";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { WEEKDAYS } from "@/lib/calendar/calendar-types";
import { listLocalBusinessClosures, saveLocalBusinessClosures } from "@/lib/calendar/local-closures";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import { getLocalCustomerSiteSettings, saveLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import { listLocalStaff, saveLocalStaff } from "@/lib/staff/local-staff";
import { listLocalStaffRoles, saveLocalStaffRoles, seedLocalStaffRoles, type StaffRoleDefinition } from "@/lib/staff/staff-role-settings";
import { StaffAvailabilityMode, StaffRoleType, type StaffMember } from "@/lib/staff/staff-types";
import { formatSiteCurrency, formatUkDate, weekdayLabel } from "@/lib/ui/display-labels";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { getLocalVoucherSettings, saveLocalVoucherSettings } from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

type DemoBusinessAdminPageProps = {
  template: WebsiteTemplate;
};

const permissionAreas = ["staff", "rotas", "bookings", "financials", "services", "vouchers", "pages", "notifications"] as const;

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X / Twitter" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
] as const;
const MAX_LOGO_BYTES = 1024 * 1024;
const MAX_FAVICON_BYTES = 512 * 1024;

function makeServiceId(): string {
  return `service_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function makeStaffId(): string {
  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function makeRoleId(): string {
  return `role_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function summarizeDays(days?: string[]): string {
  if (!days || days.length === 0) return "No days selected";
  return days.map((d) => weekdayLabel(d as never)).join(", ");
}

function CollapsibleSection({ title, subtitle, defaultOpen = false, children }: { title: string; subtitle: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none px-5 py-4">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </summary>
      <div className="border-t border-slate-200 px-5 py-4">{children}</div>
    </details>
  );
}

export function DemoBusinessAdminPage({ template }: DemoBusinessAdminPageProps) {
  const initialSettings = useMemo(() => getLocalCustomerSiteSettings(template.slug, template), [template]);
  const [settings, setSettings] = useState(initialSettings);
  const [voucherSettings, setVoucherSettings] = useState(getLocalVoucherSettings(template.slug));
  const [staffMembers, setStaffMembers] = useState(listLocalStaff(template.slug));
  const [closures, setClosures] = useState(listLocalBusinessClosures(template.slug));
  const [roles, setRoles] = useState<StaffRoleDefinition[]>(() => {
    const existing = listLocalStaffRoles(template.slug);
    return existing.length > 0 ? existing : seedLocalStaffRoles(template.slug);
  });
  const activeRoles = roles.filter((role) => role.active);

  const [superUserPermissions, setSuperUserPermissions] = useState<Record<string, boolean>>(Object.fromEntries(permissionAreas.map((area) => [area, true])));
  const [message, setMessage] = useState<string | null>(null);
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureLabel, setNewClosureLabel] = useState("");
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([]);
  const [expandedStaffIds, setExpandedStaffIds] = useState<string[]>([]);
  const [closureConflictMessage, setClosureConflictMessage] = useState<string | null>(null);
  const [closureConflicts, setClosureConflicts] = useState<
    {
      id: string;
      preferredTime?: string;
      customerName: string;
      serviceName?: string;
      assignedStaffName?: string;
      paymentStatus?: string;
    }[]
  >([]);

  const currency = settings.paymentSettings.currencyCode ?? "GBP";

  function persistSettings(): void {
    saveLocalCustomerSiteSettings(settings);
    saveLocalVoucherSettings(template.slug, voucherSettings);
    saveLocalStaff(template.slug, staffMembers);
    saveLocalBusinessClosures(template.slug, closures);
    saveLocalStaffRoles(template.slug, roles);
    setMessage("Business site settings saved.");
  }

  function toggleServiceExpanded(serviceId: string): void {
    setExpandedServiceIds((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
  }
  function toggleStaffExpanded(staffId: string): void {
    setExpandedStaffIds((current) => current.includes(staffId) ? current.filter((id) => id !== staffId) : [...current, staffId]);
  }

  function addService(): void {
    const id = makeServiceId();
    setSettings((current) => ({
      ...current,
      services: [...current.services, { id, name: "New service", description: "", basePriceGbp: 0, durationMinutes: 45, bufferAfterMinutes: 0, bookable: true, requiresQuote: false, active: true }],
    }));
    setExpandedServiceIds((current) => [...current, id]);
  }

  function addStaff(): void {
    const now = new Date().toISOString();
    const defaultRole = activeRoles[0];
    const id = makeStaffId();
    const next: StaffMember = {
      id,
      displayName: "New staff member",
      role: StaffRoleType.GENERAL_STAFF,
      roleLabel: defaultRole?.label ?? "Team Member",
      serviceIds: settings.services.filter((service) => service.active).map((service) => service.id),
      active: true,
      customerSelectable: true,
      isSuperUser: false,
      availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      availabilityMode: StaffAvailabilityMode.APPOINTMENT_ONLY,
      createdAtIso: now,
      updatedAtIso: now,
    };
    setStaffMembers((current) => [...current, next]);
    setExpandedStaffIds((current) => [...current, id]);
  }

  function addRole(): void {
    const label = newRoleLabel.trim();
    if (!label) return;
    const now = new Date().toISOString();
    setRoles((current) => [...current, { id: makeRoleId(), label, active: true, createdAtIso: now, updatedAtIso: now }]);
    setNewRoleLabel("");
  }

  function applyBrandingFile(
    file: File | undefined,
    type: "logo" | "favicon",
  ): void {
    if (!file) return;
    const maxBytes = type === "logo" ? MAX_LOGO_BYTES : MAX_FAVICON_BYTES;
    if (file.size > maxBytes) {
      setMessage(`${type === "logo" ? "Logo" : "Favicon"} exceeds the local preview limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : undefined;
      if (!value) return;
      setSettings((current) => ({
        ...current,
        branding: {
          ...current.branding,
          ...(type === "logo"
            ? {
                logoUrl: value,
                logoAlt: `${current.branding.siteName || current.businessDetails.businessName} logo`,
              }
            : { faviconUrl: value }),
        },
      }));
      setMessage(`${type === "logo" ? "Logo" : "Favicon"} preview updated locally.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Business admin portal</p>
        <h1 className="mt-2 text-3xl font-bold">Site owner control centre</h1>
        <p className="mt-2 text-sm text-slate-200">This is the subscriber business-owner admin area for this site. Platform admin for MyExperiment.club is separate.</p>
        <div className="mt-4">
          <DemoSiteNav
            templateSlug={template.slug}
            showAbout={settings.pageVisibility.about.enabled}
            showContact={settings.pageVisibility.contact.enabled}
          />
        </div>
      </section>

      <DemoAccessDetailsCard />

      <CollapsibleSection title="Business settings" subtitle="Branding, currency and social profile links.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Site/page display name
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.branding.siteName}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  branding: { ...current.branding, siteName: event.target.value },
                }))
              }
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">Currency
            <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={currency} onChange={(event) => setSettings((current) => ({ ...current, paymentSettings: { ...current.paymentSettings, currencyCode: event.target.value as "GBP" | "EUR" | "USD" } }))}>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Business branding</p>
          <p className="mt-1 text-xs text-slate-600">Use text branding or upload local preview assets. Files remain local to this browser.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-800">Logo upload (local preview)</p>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="mt-2 block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:font-semibold file:text-white hover:file:bg-slate-800"
                onChange={(event) => applyBrandingFile(event.target.files?.[0], "logo")}
              />
              <p className="mt-2 text-xs text-slate-600">Recommended: PNG or SVG. 512 x 512 px (square icon) or 1200 x 400 px (wide header). Maximum file size: 1 MB. Transparent background recommended.</p>
              {settings.branding.logoUrl ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-rose-700"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      branding: { ...current.branding, logoUrl: undefined, logoAlt: undefined },
                    }))
                  }
                >
                  Remove logo
                </button>
              ) : null}
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-800">Favicon upload (local preview)</p>
              <input
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                className="mt-2 block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:font-semibold file:text-white hover:file:bg-slate-800"
                onChange={(event) => applyBrandingFile(event.target.files?.[0], "favicon")}
              />
              <p className="mt-2 text-xs text-slate-600">Recommended: PNG or ICO. 32 x 32 px minimum, 512 x 512 px source recommended. Maximum file size: 512 KB.</p>
              {settings.branding.faviconUrl ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-rose-700"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      branding: { ...current.branding, faviconUrl: undefined },
                    }))
                  }
                >
                  Remove favicon
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Social Media</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const value = settings.businessDetails.socialLinks?.[platform.key] ?? "";
              const enabled = value.length > 0;
              return (
                <div key={platform.key} className="rounded border border-slate-200 bg-white p-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => {
                        const nextLinks = { ...(settings.businessDetails.socialLinks ?? {}) };
                        if (!event.target.checked) delete nextLinks[platform.key];
                        else nextLinks[platform.key] = nextLinks[platform.key] || "https://";
                        setSettings((current) => ({ ...current, businessDetails: { ...current.businessDetails, socialLinks: nextLinks } }));
                      }}
                    />
                    {platform.label}
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    placeholder={`${platform.label} profile URL`}
                    value={value}
                    onChange={(event) => {
                      const nextLinks = { ...(settings.businessDetails.socialLinks ?? {}) };
                      nextLinks[platform.key] = event.target.value;
                      setSettings((current) => ({ ...current, businessDetails: { ...current.businessDetails, socialLinks: nextLinks } }));
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Staff positions" subtitle="Create business-specific role/position options used by staff records.">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Add position" value={newRoleLabel} onChange={(event) => setNewRoleLabel(event.target.value)} />
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addRole}>Add position</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeRoles.map((role) => (
            <div key={role.id} className="rounded-md border border-slate-200 bg-white p-2">
              <div className="flex items-center gap-2">
                <input className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs" value={role.label} onChange={(event) => setRoles((current) => current.map((item) => item.id === role.id ? { ...item, label: event.target.value, updatedAtIso: new Date().toISOString() } : item))} />
                <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setRoles((current) => current.map((item) => item.id === role.id ? { ...item, active: false, updatedAtIso: new Date().toISOString() } : item))}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Services and prices" subtitle="Compact service cards with duration and role pricing." defaultOpen>
        <div className="mb-3"><button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addService}>Add service</button></div>
        <div className="grid gap-3">
          {settings.services.map((service, index) => {
            const expanded = expandedServiceIds.includes(service.id);
            return (
              <div key={service.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-600">{getPublicServicePriceLabel(service, currency) || "Quote required"} - {service.durationMinutes ?? 45} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => toggleServiceExpanded(service.id)}>{expanded ? "Collapse" : "Edit"}</button>
                    <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setSettings((current) => ({ ...current, services: current.services.filter((item) => item.id !== service.id) }))}>Remove</button>
                  </div>
                </div>
                {expanded ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-700">Service name
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.name} onChange={(event) => setSettings((current) => { const next=[...current.services]; next[index]={...next[index],name:event.target.value}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Base price
                      <input type="number" min={0} step="1" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.basePriceGbp ?? ""} onChange={(event) => setSettings((current) => { const next=[...current.services]; const val=event.target.value.trim(); next[index]={...next[index],basePriceGbp:val?Number(val):undefined}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Duration (minutes)
                      <input type="number" min={10} step="5" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.durationMinutes ?? 45} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],durationMinutes:Number(event.target.value||45)}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Buffer after service (minutes)
                      <input type="number" min={0} step="5" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.bufferAfterMinutes ?? 0} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],bufferAfterMinutes:Number(event.target.value||0)}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description
                      <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.description} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],description:event.target.value}; return {...current,services:next};})} />
                    </label>
                    {activeRoles.length > 0 ? (
                      <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-700">Role price overrides</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {activeRoles.map((role) => {
                            const currentOverride = service.rolePriceOverrides?.find((item) => item.roleLabel === role.label);
                            return (
                              <label key={role.id} className="text-xs text-slate-700">{role.label}
                                <input type="number" min={0} step="1" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={currentOverride?.priceGbp ?? ""} placeholder="Use base price" onChange={(event)=>{const value=event.target.value.trim(); setSettings((current)=>{const next=[...current.services]; const overrides=[...(next[index].rolePriceOverrides??[])].filter((item)=>item.roleLabel!==role.label); if(value) overrides.push({roleId:role.id,roleLabel:role.label,priceGbp:Number(value)}); next[index]={...next[index],rolePriceOverrides:overrides.length?overrides:undefined}; return {...current,services:next};});}} />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Staff" subtitle="Compact staff cards with role dropdown and available days.">
        <div className="mb-3"><button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addStaff}>Add staff member</button></div>
        <div className="grid gap-3">
          {staffMembers.map((staff, index) => {
            const expanded = expandedStaffIds.includes(staff.id);
            return (
              <div key={staff.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{staff.displayName}</p>
                    <p className="text-xs text-slate-600">{staff.roleLabel || "Position not set"} - {summarizeDays(staff.availableWeekdays)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => toggleStaffExpanded(staff.id)}>{expanded ? "Collapse" : "Edit"}</button>
                    <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setStaffMembers((current) => current.filter((item) => item.id !== staff.id))}>Remove</button>
                  </div>
                </div>
                {expanded ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-700">Name
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={staff.displayName} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],displayName:event.target.value}; setStaffMembers(next);}} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Position
                      <select className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={staff.roleLabel ?? ""} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],roleLabel:event.target.value}; setStaffMembers(next);}}>
                        <option value="">Select position</option>
                        {activeRoles.map((role) => <option key={role.id} value={role.label}>{role.label}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Telephone
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={staff.phone ?? ""} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],phone:event.target.value||undefined}; setStaffMembers(next);}} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Email
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={staff.email ?? ""} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],email:event.target.value||undefined}; setStaffMembers(next);}} />
                    </label>
                    <div className="sm:col-span-2 flex flex-wrap gap-3 text-xs text-slate-700">
                      <label className="flex items-center gap-1"><input type="checkbox" checked={staff.active} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],active:event.target.checked}; setStaffMembers(next);}} />Active</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={staff.customerSelectable} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],customerSelectable:event.target.checked}; setStaffMembers(next);}} />Customer-selectable</label>
                      <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(staff.isSuperUser)} onChange={(event)=>{const next=[...staffMembers]; next[index]={...next[index],isSuperUser:event.target.checked}; setStaffMembers(next);}} />Super user</label>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-slate-700">Available working days</p>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
                        {WEEKDAYS.map((day) => {
                          const selected = (staff.availableWeekdays ?? []).includes(day);
                          return (
                            <label key={day} className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                              <input type="checkbox" checked={selected} onChange={(event)=>{const current=staff.availableWeekdays ?? []; const updated=event.target.checked?[...current,day]:current.filter((item)=>item!==day); const next=[...staffMembers]; next[index]={...next[index],availableWeekdays:updated}; setStaffMembers(next);}} />
                              {weekdayLabel(day)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Appointments" subtitle="Control customer booking slot display and staff selection behaviour." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Appointment slot block size
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.appointmentSettings.appointmentSlotIntervalMinutes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  appointmentSettings: {
                    ...current.appointmentSettings,
                    appointmentSlotIntervalMinutes: Number(event.target.value) as 15 | 30 | 60,
                  },
                }))
              }
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.appointmentSettings.allowCustomerStaffSelection}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  appointmentSettings: {
                    ...current.appointmentSettings,
                    allowCustomerStaffSelection: event.target.checked,
                  },
                }))
              }
            />
            Allow customer staff selection
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-600">Slot interval affects how available times are shown on the customer booking page.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Rota and breaks" subtitle="Select one staff member and edit a compact weekly rota.">
        <StaffRotaEditor industrySlug={template.slug} staffMembers={staffMembers} />
      </CollapsibleSection>

      <CollapsibleSection title="Ad hoc closures" subtitle="Closure dates feed booking availability.">
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={newClosureDate} onChange={(event) => setNewClosureDate(event.target.value)} />
          <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Closure label" value={newClosureLabel} onChange={(event) => setNewClosureLabel(event.target.value)} />
        </div>
        <button
          type="button"
          className="mt-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
          onClick={() => {
            if (!newClosureDate) return;
            const impacted = listLocalCustomerRequests()
              .filter(
                (request) =>
                  request.templateSlug === template.slug &&
                  request.preferredDate === newClosureDate &&
                  request.status !== CustomerRequestStatus.CANCELLED &&
                  request.status !== CustomerRequestStatus.NO_SHOW,
              )
              .map((request) => ({
                id: request.id,
                preferredTime: request.preferredTime,
                customerName: request.customerName,
                serviceName: request.serviceName,
                assignedStaffName: request.assignedStaffName,
                paymentStatus: request.paymentStatus,
              }));
            setClosureConflicts(impacted);
            setClosureConflictMessage(
              impacted.length === 0
                ? "No appointments found for this closure date."
                : "Appointments exist on this date. Contact customers before closing.",
            );
            setClosures((current) => [
              ...current,
              {
                id: `closure_${Date.now()}`,
                industrySlug: template.slug,
                date: newClosureDate,
                label: newClosureLabel || "Closed",
                allDay: true,
                active: true,
                createdAtIso: new Date().toISOString(),
                updatedAtIso: new Date().toISOString(),
              },
            ]);
            setNewClosureDate("");
            setNewClosureLabel("");
          }}
        >
          Add closure
        </button>
        {closureConflictMessage ? (
          <p
            className={`mt-2 text-xs ${
              closureConflicts.length > 0 ? "font-semibold text-rose-700" : "text-emerald-700"
            }`}
          >
            {closureConflictMessage}
          </p>
        ) : null}
        {closureConflicts.length > 0 ? (
          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2">
            <p className="text-xs font-semibold text-rose-800">Affected appointments</p>
            <ul className="mt-1 space-y-1 text-xs text-rose-900">
              {closureConflicts.map((item) => (
                <li key={item.id}>
                  {item.preferredTime || "Time TBC"} - {item.customerName} - {item.serviceName || "Service"} -{" "}
                  {item.assignedStaffName || "Unassigned"}{item.paymentStatus ? ` (${item.paymentStatus})` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {closures.length === 0 ? <li>No closures added.</li> : null}
          {closures.map((closure) => (
            <li key={closure.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
              <span>{formatUkDate(closure.date)} - {closure.label}</span>
              <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setClosures((current) => current.filter((item) => item.id !== closure.id))}>Remove</button>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Gift vouchers" subtitle="Enable vouchers and configure delivery methods.">
        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={voucherSettings.enabled} onChange={(event) => setVoucherSettings((current) => ({ ...current, enabled: event.target.checked }))} />Enable gift vouchers</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={voucherSettings.allowCustomValue} onChange={(event) => setVoucherSettings((current) => ({ ...current, allowCustomValue: event.target.checked }))} />Allow customer-entered voucher values</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Min value ({formatSiteCurrency(1, currency).replace(/[0-9.,\s]/g,"")})<input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.minValueGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, minValueGbp: Number(event.target.value || 0) }))} /></label>
            <label className="text-xs">Max value ({formatSiteCurrency(1, currency).replace(/[0-9.,\s]/g,"")})<input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.maxValueGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, maxValueGbp: Number(event.target.value || 0) }))} /></label>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <p className="text-xs font-semibold text-slate-700">Delivery Options</p>
            <div className="mt-1 space-y-1 text-xs">
              {[{method:VoucherDeliveryMethod.DIGITAL_EMAIL,label:"Email"},{method:VoucherDeliveryMethod.COLLECT_IN_STORE,label:"Collect in store"},{method:VoucherDeliveryMethod.POST,label:"Post"}].map((item) => (
                <label key={item.method} className="flex items-center gap-2">
                  <input type="checkbox" checked={voucherSettings.deliveryMethods.includes(item.method)} onChange={(event) => setVoucherSettings((current) => ({ ...current, deliveryMethods: event.target.checked ? [...current.deliveryMethods, item.method] : current.deliveryMethods.filter((method) => method !== item.method) }))} />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <label className="text-xs">Postage charge ({formatSiteCurrency(1, currency).replace(/[0-9.,\s]/g,"")})<input type="number" step="0.5" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.postageChargeGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, postageChargeGbp: Number(event.target.value || 0) }))} /></label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Page visibility/content" subtitle="Enable pages and edit About/Contact content shown on the demo site.">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.pageVisibility.about.enabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    pageVisibility: {
                      ...current.pageVisibility,
                      about: { ...current.pageVisibility.about, enabled: event.target.checked },
                    },
                  }))
                }
              />
              Enable About Us page
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.pageVisibility.contact.enabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    pageVisibility: {
                      ...current.pageVisibility,
                      contact: { ...current.pageVisibility.contact, enabled: event.target.checked },
                    },
                  }))
                }
              />
              Enable Contact page
            </label>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">About page content</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Page title
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.title}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: { ...current.pageContent.about, title: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">Image placement
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.imagePlacement}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: {
                          ...current.pageContent.about,
                          imagePlacement: event.target.value as "NONE" | "ABOVE_TEXT" | "BESIDE_TEXT",
                        },
                      },
                    }))
                  }
                >
                  <option value="NONE">No image</option>
                  <option value="ABOVE_TEXT">Image above text</option>
                  <option value="BESIDE_TEXT">Image beside text</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Main text/body
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  rows={3}
                  value={settings.pageContent.about.body}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: { ...current.pageContent.about, body: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Image placeholder or URL (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.imageUrl ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: { ...current.pageContent.about, imageUrl: event.target.value || undefined },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">CTA label (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.ctaLabel ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: { ...current.pageContent.about, ctaLabel: event.target.value || undefined },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">CTA link (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.ctaHref ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: { ...current.pageContent.about, ctaHref: event.target.value || undefined },
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Contact page content</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Page title
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.title}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: { ...current.pageContent.contact, title: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">Image placement
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.imagePlacement}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: {
                          ...current.pageContent.contact,
                          imagePlacement: event.target.value as "NONE" | "ABOVE_TEXT" | "BESIDE_TEXT",
                        },
                      },
                    }))
                  }
                >
                  <option value="NONE">No image</option>
                  <option value="ABOVE_TEXT">Image above text</option>
                  <option value="BESIDE_TEXT">Image beside text</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Intro text/body
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  rows={3}
                  value={settings.pageContent.contact.body}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: { ...current.pageContent.contact, body: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Contact details text
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.contactDetailsText ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: {
                          ...current.pageContent.contact,
                          contactDetailsText: event.target.value || undefined,
                        },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Map/location placeholder text
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.mapPlaceholderText ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: {
                          ...current.pageContent.contact,
                          mapPlaceholderText: event.target.value || undefined,
                        },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">CTA label (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.ctaLabel ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: { ...current.pageContent.contact, ctaLabel: event.target.value || undefined },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">CTA link (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.contact.ctaHref ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: { ...current.pageContent.contact, ctaHref: event.target.value || undefined },
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Payments/sales" subtitle="Local-only operational sales recording preferences.">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={settings.paymentSettings.allowInStorePaymentRecording} onChange={(event) => setSettings((current) => ({ ...current, paymentSettings: { ...current.paymentSettings, allowInStorePaymentRecording: event.target.checked } }))} />
          Allow in-store payment recording
        </label>
        <p className="mt-2 text-xs text-slate-600">Shows a staff tool for recording cash/card payments taken in store. This does not process payments, but allows for accurate finance reporting.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Super-user permissions" subtitle="Choose which areas delegated users can access.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {permissionAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"><input type="checkbox" checked={Boolean(superUserPermissions[area])} onChange={(event) => setSuperUserPermissions((current) => ({ ...current, [area]: event.target.checked }))} />{area}</label>
          ))}
        </div>
      </CollapsibleSection>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800" onClick={persistSettings}>Save business settings</button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}





