"use client";

import { ReactNode, useMemo, useState } from "react";
import { StaffRotaEditor } from "@/components/calendar/staff-rota-editor";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { WEEKDAYS } from "@/lib/calendar/calendar-types";
import type { Weekday } from "@/lib/calendar/calendar-types";
import { listLocalBusinessClosures, saveLocalBusinessClosures } from "@/lib/calendar/local-closures";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import { getLocalCustomerSiteSettings, saveLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import {
  mapAppearanceToTheme,
  resolveAppearanceMode,
  type SiteAppearanceMode,
} from "@/lib/sites/site-appearance";
import { WebsiteTemplate } from "@/lib/sites/types";
import { listLocalStaff, saveLocalStaff } from "@/lib/staff/local-staff";
import { listLocalStaffRoles, saveLocalStaffRoles, seedLocalStaffRoles, type StaffRoleDefinition } from "@/lib/staff/staff-role-settings";
import { StaffAvailabilityMode, StaffRoleType, type StaffMember } from "@/lib/staff/staff-types";
import { formatSiteCurrency, formatUkDate, weekdayLabel } from "@/lib/ui/display-labels";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { downloadCsvTemplate, readCsvRecords } from "@/lib/demo/csv-tools";
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

function paymentStatusText(status?: string): string {
  return status === "PAYMENT_COMPLETED" ? "Payment Completed" : "Requires Payment";
}

function bookingStatusBadge(status: CustomerRequestStatus): string {
  if (status === CustomerRequestStatus.CANCELLED) return "bg-rose-100 text-rose-800";
  if (status === CustomerRequestStatus.COMPLETED) return "bg-emerald-100 text-emerald-800";
  if (status === CustomerRequestStatus.CONFIRMED) return "bg-sky-100 text-sky-800";
  return "bg-amber-100 text-amber-800";
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
  const adminSectionGroups = [
    {
      title: "Website & content",
      sections: [
        { id: "site-design", label: "Site appearance" },
        { id: "page-content", label: "Page visibility/content" },
        { id: "policies", label: "Policies" },
        { id: "gift-vouchers", label: "Gift vouchers" },
      ],
    },
    {
      title: "Business setup",
      sections: [
        { id: "business-settings", label: "Business settings" },
        { id: "services-prices", label: "Services and prices" },
        { id: "payments", label: "Payment settings" },
        { id: "import-export", label: "Import/export setup data" },
      ],
    },
    {
      title: "Bookings & availability",
      sections: [
        { id: "appointments", label: "Bookings" },
        { id: "rota-breaks", label: "Rota and breaks" },
        { id: "closures", label: "Ad hoc closures" },
      ],
    },
    {
      title: "Staff & permissions",
      sections: [
        { id: "staff", label: "Staff" },
        { id: "staff-positions", label: "Staff positions" },
        { id: "super-user", label: "Super-user permissions" },
      ],
    },
  ] as const;

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
  const [newServiceCategoryName, setNewServiceCategoryName] = useState("");
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([]);
  const [expandedStaffIds, setExpandedStaffIds] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("appointments");
  const [csvPreview, setCsvPreview] = useState<{
    type: "services" | "staff";
    rows: string[];
    fileName: string;
  } | null>(null);
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
  const appearanceMode = resolveAppearanceMode(
    settings.branding.visualTemplateId,
    settings.branding.colourSchemeId,
  );
  const allBookings = useMemo(
    () =>
      listLocalCustomerRequests()
        .filter((request) => request.templateSlug === template.slug)
        .sort((a, b) => {
          const left = `${a.preferredDate ?? ""} ${a.preferredTime ?? ""}`;
          const right = `${b.preferredDate ?? ""} ${b.preferredTime ?? ""}`;
          return left.localeCompare(right);
        }),
    [template.slug],
  );
  const todayIso = new Date().toISOString().slice(0, 10);
  const cancelledBookings = allBookings.filter(
    (request) => request.status === CustomerRequestStatus.CANCELLED,
  );
  const todayBookings = allBookings.filter(
    (request) => request.preferredDate === todayIso,
  );
  const futureBookings = allBookings.filter(
    (request) => request.preferredDate && request.preferredDate > todayIso,
  );
  const [refundStatusByBookingId, setRefundStatusByBookingId] = useState<
    Record<string, "REFUND_REQUIRED" | "REFUND_COMPLETE">
  >({});

  function updateSettingsAndPersist(
    updater: (current: typeof settings) => typeof settings,
    successMessage?: string,
  ): void {
    setSettings((current) => {
      const next = updater(current);
      saveLocalCustomerSiteSettings(next);
      return next;
    });
    if (successMessage) {
      setMessage(successMessage);
    }
  }

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
    const defaultCategory = settings.serviceCategories[0] ?? "Services";
    setSettings((current) => ({
      ...current,
      services: [...current.services, { id, name: "New service", description: "", basePriceGbp: 0, durationMinutes: 45, bufferAfterMinutes: 0, bookable: true, requiresQuote: false, active: true, category: defaultCategory }],
    }));
    setExpandedServiceIds((current) => [...current, id]);
  }

  function addServiceCategory(): void {
    const category = newServiceCategoryName.trim();
    if (!category) return;
    setSettings((current) => {
      const exists = current.serviceCategories.some(
        (item) => item.trim().toLowerCase() === category.toLowerCase(),
      );
      if (exists) return current;
      return { ...current, serviceCategories: [...current.serviceCategories, category] };
    });
    setNewServiceCategoryName("");
  }

  function renameServiceCategory(index: number, value: string): void {
    setSettings((current) => {
      const previous = current.serviceCategories[index];
      const nextCategories = [...current.serviceCategories];
      nextCategories[index] = value;
      return {
        ...current,
        serviceCategories: nextCategories,
        services: current.services.map((service) =>
          service.category === previous ? { ...service, category: value } : service,
        ),
      };
    });
  }

  function removeServiceCategory(category: string): void {
    setSettings((current) => ({
      ...current,
      serviceCategories: current.serviceCategories.filter((item) => item !== category),
      services: current.services.map((service) =>
        service.category === category ? { ...service, category: undefined } : service,
      ),
    }));
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

  async function handleCsvUpload(
    file: File | undefined,
    type: "services" | "staff",
  ): Promise<void> {
    if (!file) return;
    const records = await readCsvRecords(file);
    setCsvPreview({
      type,
      rows:
        type === "services"
          ? records.map((row) => row.serviceName || "")
          : records.map((row) => row.staffName || row.displayName || ""),
      fileName: file.name,
    });

    if (type === "services" && records.length > 0) {
      setSettings((current) => ({
        ...current,
        serviceCategories: Array.from(
          new Map(
            [
              ...current.serviceCategories,
              ...records.map((row) => row.category),
            ]
              .map((value) => value?.trim())
              .filter((value): value is string => Boolean(value))
              .map((value) => [value.toLowerCase(), value]),
          ).values(),
        ),
        services: records
          .filter((row) => (row.serviceName || "").trim().length > 0)
          .map((row, index) => ({
          id: `csv-service-${index + 1}`,
          name: row.serviceName.trim(),
          description: row.description ?? "",
          category: (row.category ?? "").trim() || "Services",
          basePriceGbp:
            row.basePrice && Number.isFinite(Number(row.basePrice))
              ? Number(row.basePrice)
              : undefined,
          durationMinutes:
            row.durationMinutes && Number.isFinite(Number(row.durationMinutes))
              ? Number(row.durationMinutes)
              : 45,
          bufferAfterMinutes:
            row.bufferAfterMinutes &&
            Number.isFinite(Number(row.bufferAfterMinutes))
              ? Number(row.bufferAfterMinutes)
              : 0,
          bookable: true,
          requiresQuote: false,
          active: true,
          rolePriceOverrides: activeRoles
            .map((role) => {
              const key = `rolePrice:${role.label}`;
              const raw = row[key];
              if (!raw || !Number.isFinite(Number(raw))) return null;
              return {
                roleId: role.id,
                roleLabel: role.label,
                priceGbp: Number(raw),
              };
            })
            .filter((value): value is NonNullable<typeof value> => Boolean(value)),
        })),
      }));
      return;
    }

    if (type === "staff" && records.length > 0) {
      const now = new Date().toISOString();
      const defaultRole = activeRoles[0]?.label ?? "Team Member";
      const weekdays: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      setStaffMembers((current) => [
        ...current,
        ...records
          .filter((row) => (row.staffName || row.displayName || "").trim().length > 0)
          .map((row, index) => ({
          id: `csv-staff-${Date.now()}-${index + 1}`,
          displayName: (row.staffName || row.displayName || "").trim(),
          role: StaffRoleType.GENERAL_STAFF,
          roleLabel: (row.roleLabel || defaultRole).trim(),
          serviceIds: settings.services.filter((service) => service.active).map((service) => service.id),
          active: row.active ? row.active.toLowerCase() !== "false" : true,
          customerSelectable: row.customerSelectable
            ? row.customerSelectable.toLowerCase() !== "false"
            : true,
          isSuperUser: false,
          availableWeekdays: weekdays,
          availabilityMode: StaffAvailabilityMode.APPOINTMENT_ONLY,
          createdAtIso: now,
          updatedAtIso: now,
        })),
      ]);
    }
  }

  return (
    <DemoSitePageShell template={template} settings={settings}>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Admin sections</p>
        <p className="mt-1 text-xs text-slate-600">
          Select a section tile to open its settings panel.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {adminSectionGroups.map((group) => (
            <div key={group.title} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {group.title}
              </p>
              <div className="mt-2 grid gap-2">
                {group.sections.map((section) => {
                  const active = selectedSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                      }`}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedSection === "business-settings" ? (
      <CollapsibleSection title="Business settings" subtitle="Branding, currency and social profile links." defaultOpen>
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
          <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Hero headline
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.branding.heroHeadline ?? ""}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  branding: { ...current.branding, heroHeadline: event.target.value },
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
      ) : null}

      {selectedSection === "site-design" ? (
      <CollapsibleSection title="Site appearance" subtitle="Choose a simple light or dark appearance for this demo site." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Appearance
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={appearanceMode}
              onChange={(event) => {
                const appearance = mapAppearanceToTheme(
                  event.target.value as SiteAppearanceMode,
                );
                updateSettingsAndPersist(
                  (current) => ({
                    ...current,
                    branding: {
                      ...current.branding,
                      visualTemplateId: appearance.visualThemeId,
                      colourSchemeId: appearance.colourPaletteId,
                    },
                  }),
                  "Site appearance updated for this demo site.",
                );
              }}
            >
              <option value="LIGHT">Light</option>
              <option value="DARK">Dark</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Choose a simple light or dark appearance. The site layout stays professionally
          controlled so your pages remain clean and consistent.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Business photos can be added later. This launch appearance control keeps site
          styling clean and consistent without requiring image uploads.
        </p>
        <a
          href={`/demo/${template.slug}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
        >
          Open customer site preview
        </a>
      </CollapsibleSection>
      ) : null}

      {selectedSection === "staff-positions" ? (
      <CollapsibleSection title="Staff positions" subtitle="Create business-specific role/position options used by staff records." defaultOpen>
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
      ) : null}

      {selectedSection === "services-prices" ? (
      <CollapsibleSection title="Services and prices" subtitle="Compact service cards with duration and role pricing." defaultOpen>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Service categories</h4>
              <p className="mt-1 text-xs text-slate-600">
                Create the categories customers will see when browsing your services.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[190px] rounded-md border border-slate-300 px-2 py-1 text-sm"
                placeholder="New category name"
                value={newServiceCategoryName}
                onChange={(event) => setNewServiceCategoryName(event.target.value)}
              />
              <button
                type="button"
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                onClick={addServiceCategory}
              >
                Add category
              </button>
            </div>
          </div>
          {settings.serviceCategories.length === 0 ? (
            <p className="mt-3 text-xs text-slate-600">No categories yet. Services can stay uncategorised.</p>
          ) : (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {settings.serviceCategories.map((category, categoryIndex) => (
                <div key={`${category}-${categoryIndex}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  <input
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={category}
                    onChange={(event) => renameServiceCategory(categoryIndex, event.target.value)}
                  />
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-rose-700"
                    onClick={() => removeServiceCategory(category)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-3"><button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addService}>Add service</button></div>
        <div className="grid gap-3">
          {settings.services.map((service, index) => {
            const expanded = expandedServiceIds.includes(service.id);
            return (
              <div key={service.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-600">
                      {service.category ? `${service.category} - ` : ""}
                      {getPublicServicePriceLabel(service, currency) || "Quote required"} - {service.durationMinutes ?? 45} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => toggleServiceExpanded(service.id)}>{expanded ? "Collapse" : "Edit"}</button>
                    <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setSettings((current) => ({ ...current, services: current.services.filter((item) => item.id !== service.id) }))}>Remove</button>
                  </div>
                </div>
                {expanded ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="text-xs font-semibold text-slate-700 md:col-span-2">Service name
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.name} onChange={(event) => setSettings((current) => { const next=[...current.services]; next[index]={...next[index],name:event.target.value}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Category
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={service.category ?? ""}
                        onChange={(event) => setSettings((current) => { const next=[...current.services]; next[index]={...next[index],category:event.target.value || undefined}; return {...current,services:next};})}
                      >
                        <option value="">Uncategorised</option>
                        {settings.serviceCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[11px] font-normal text-slate-600">Assign this service to a category.</span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Base price
                      <input type="number" min={0} step="1" className="mt-1 w-full max-w-36 rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.basePriceGbp ?? ""} onChange={(event) => setSettings((current) => { const next=[...current.services]; const val=event.target.value.trim(); next[index]={...next[index],basePriceGbp:val?Number(val):undefined}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Duration (minutes)
                      <input type="number" min={10} step="5" className="mt-1 w-full max-w-36 rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.durationMinutes ?? 45} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],durationMinutes:Number(event.target.value||45)}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">Buffer after service (minutes)
                      <input type="number" min={0} step="5" className="mt-1 w-full max-w-36 rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.bufferAfterMinutes ?? 0} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],bufferAfterMinutes:Number(event.target.value||0)}; return {...current,services:next};})} />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 md:col-span-3">Description
                      <textarea className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={service.description} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],description:event.target.value}; return {...current,services:next};})} />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 md:col-span-3">
                      <input type="checkbox" checked={Boolean(service.recurringEnabled)} disabled={!settings.paymentSettings.recurringPaymentsEnabled} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],recurringEnabled:event.target.checked}; return {...current,services:next};})} />
                      Allow this service to be sold as recurring
                    </label>
                    {service.recurringEnabled && settings.paymentSettings.recurringPaymentsEnabled ? (
                      <div className="md:col-span-3">
                        <p className="text-xs font-semibold text-slate-700">Recurring intervals</p>
                        <div className="mt-1 flex flex-wrap gap-3">
                          {(["WEEKLY", "MONTHLY", "ANNUALLY"] as const).map((interval) => (
                            <label key={interval} className="flex items-center gap-1 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={(service.recurringIntervals ?? []).includes(interval)}
                                onChange={(event) =>
                                  setSettings((current) => {
                                    const next = [...current.services];
                                    const values = new Set(next[index].recurringIntervals ?? []);
                                    if (event.target.checked) values.add(interval);
                                    else values.delete(interval);
                                    next[index] = { ...next[index], recurringIntervals: [...values] };
                                    return { ...current, services: next };
                                  })
                                }
                              />
                              {interval.charAt(0) + interval.slice(1).toLowerCase()}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 md:col-span-3">
                      <input type="checkbox" checked={Boolean(service.blockBookingEnabled)} disabled={!settings.appointmentSettings.customerBlockBookingsEnabled} onChange={(event) => setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],blockBookingEnabled:event.target.checked}; return {...current,services:next};})} />
                      Allow block bookings for this service
                    </label>
                    {service.blockBookingEnabled && settings.appointmentSettings.customerBlockBookingsEnabled ? (
                      <label className="text-xs font-semibold text-slate-700 md:col-span-3">
                        Suggested block counts (comma separated)
                        <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={(service.blockBookingSuggestedCounts ?? []).join(", ")} placeholder="5, 10, 12" onChange={(event)=>setSettings((current)=>{const next=[...current.services]; next[index]={...next[index],blockBookingSuggestedCounts:event.target.value.split(',').map((v)=>Number(v.trim())).filter((n)=>Number.isFinite(n)&&n>=2&&n<=52)}; return {...current,services:next};})} />
                      </label>
                    ) : null}
                    {activeRoles.length > 0 ? (
                      <div className="md:col-span-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-700">Role price overrides</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {activeRoles.map((role) => {
                            const currentOverride = service.rolePriceOverrides?.find((item) => item.roleLabel === role.label);
                            return (
                              <label key={role.id} className="text-xs text-slate-700">{role.label}
                                <input type="number" min={0} step="1" className="mt-1 w-full max-w-32 rounded-md border border-slate-300 px-2 py-1 text-sm" value={currentOverride?.priceGbp ?? ""} placeholder="Use base price" onChange={(event)=>{const value=event.target.value.trim(); setSettings((current)=>{const next=[...current.services]; const overrides=[...(next[index].rolePriceOverrides??[])].filter((item)=>item.roleLabel!==role.label); if(value) overrides.push({roleId:role.id,roleLabel:role.label,priceGbp:Number(value)}); next[index]={...next[index],rolePriceOverrides:overrides.length?overrides:undefined}; return {...current,services:next};});}} />
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
      ) : null}

      {selectedSection === "import-export" ? (
      <CollapsibleSection title="Import/export setup data" subtitle="Download CSV templates and import service/staff rows into this local demo." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">Services/products/pricing</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                onClick={() =>
                  downloadCsvTemplate("services-template.csv", (() => {
                    const roleHeaders = activeRoles.map((role) => `rolePrice:${role.label}`);
                    const headers = [
                      "serviceName",
                      "basePrice",
                      "durationMinutes",
                      "bufferAfterMinutes",
                      "category",
                      "description",
                      ...roleHeaders,
                    ];
                    const values = [
                      "Standard Service",
                      "25",
                      "45",
                      "0",
                      "Services",
                      "Short description",
                      ...roleHeaders.map(() => ""),
                    ];
                    return `${headers.join(",")}\n${values.join(",")}`;
                  })())
                }
              >
                Download services CSV template
              </button>
              <label className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                Upload services CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    void handleCsvUpload(event.target.files?.[0], "services");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">Staff/team</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                onClick={() =>
                  downloadCsvTemplate(
                    "staff-template.csv",
                    "staffName,role,email,phone\nTeam Member,Owner,team@example.com,07123456789",
                  )
                }
              >
                Download staff CSV template
              </button>
              <label className="cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                Upload staff CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    void handleCsvUpload(event.target.files?.[0], "staff");
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        {csvPreview ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <p className="font-semibold">
              {csvPreview.type === "services" ? "Services" : "Staff"} CSV preview ({csvPreview.fileName})
            </p>
            <p className="mt-1">Rows detected: {csvPreview.rows.length}</p>
            <ul className="mt-1 list-disc pl-4">
              {csvPreview.rows.slice(0, 6).map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
            {csvPreview.type === "services" ? (
              <p className="mt-2 text-slate-600">
                Expected service columns: serviceName, basePrice, durationMinutes,
                bufferAfterMinutes, category, description, plus optional
                rolePrice:&lt;role label&gt; columns.
              </p>
            ) : null}
          </div>
        ) : null}
      </CollapsibleSection>
      ) : null}

      {selectedSection === "staff" ? (
      <CollapsibleSection title="Staff" subtitle="Compact staff cards with role dropdown and available days." defaultOpen>
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
      ) : null}

      {selectedSection === "appointments" ? (
      <CollapsibleSection title="Bookings" subtitle="Operational booking dashboard and slot controls." defaultOpen>
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
          <label className="flex items-center gap-2 self-end text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(settings.appointmentSettings.customerBlockBookingsEnabled)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  appointmentSettings: {
                    ...current.appointmentSettings,
                    customerBlockBookingsEnabled: event.target.checked,
                  },
                }))
              }
            />
            Allow customer block bookings
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Slot interval affects how available times are shown on the customer booking page.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-900">Cancellations</p>
            <p className="mt-1 text-xs text-rose-800">
              Check whether a refund is needed. Process refunds through your payment provider, then mark as complete.
            </p>
            <div className="mt-2 space-y-2">
              {cancelledBookings.length === 0 ? (
                <p className="text-xs text-slate-600">No cancelled bookings.</p>
              ) : (
                cancelledBookings.slice(0, 8).map((request) => (
                  <div key={request.id} className="rounded border border-rose-200 bg-white p-2 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">{request.customerName}</p>
                    <p>{request.serviceName || "Service"} • {request.preferredDate || "Date TBC"} {request.preferredTime || ""}</p>
                    <p>{paymentStatusText(request.paymentStatus)}</p>
                    <div className="mt-1 flex gap-1">
                      <button
                        type="button"
                        className={`rounded px-2 py-0.5 font-semibold ${
                          (refundStatusByBookingId[request.id] ?? "REFUND_REQUIRED") === "REFUND_REQUIRED"
                            ? "bg-rose-700 text-white"
                            : "border border-rose-300 bg-white text-rose-700"
                        }`}
                        onClick={() =>
                          setRefundStatusByBookingId((current) => ({
                            ...current,
                            [request.id]: "REFUND_REQUIRED",
                          }))
                        }
                      >
                        Refund required
                      </button>
                      <button
                        type="button"
                        className={`rounded px-2 py-0.5 font-semibold ${
                          refundStatusByBookingId[request.id] === "REFUND_COMPLETE"
                            ? "bg-emerald-700 text-white"
                            : "border border-emerald-300 bg-white text-emerald-700"
                        }`}
                        onClick={() =>
                          setRefundStatusByBookingId((current) => ({
                            ...current,
                            [request.id]: "REFUND_COMPLETE",
                          }))
                        }
                      >
                        Refund complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Today</p>
            <div className="mt-2 space-y-2">
              {todayBookings.length === 0 ? (
                <p className="text-xs text-slate-600">No bookings today.</p>
              ) : (
                todayBookings.map((request) => (
                  <div key={request.id} className="rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{request.preferredTime || "Time TBC"} • {request.customerName}</p>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${bookingStatusBadge(request.status)}`}>
                        {request.status === CustomerRequestStatus.CANCELLED ? "Cancelled" : request.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p>{request.serviceName || "Service"} • {request.assignedStaffName || "Unassigned"}</p>
                    <p>{paymentStatusText(request.paymentStatus)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Future</p>
            <div className="mt-2 space-y-2">
              {futureBookings.length === 0 ? (
                <p className="text-xs text-slate-600">No future bookings.</p>
              ) : (
                futureBookings.slice(0, 10).map((request) => (
                  <div key={request.id} className="rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{request.preferredDate || "Date TBC"} {request.preferredTime || ""}</p>
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${bookingStatusBadge(request.status)}`}>
                        {request.status === CustomerRequestStatus.CANCELLED ? "Cancelled" : request.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p>{request.customerName} • {request.serviceName || "Service"}</p>
                    <p>{request.assignedStaffName || "Unassigned"} • {paymentStatusText(request.paymentStatus)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>
      ) : null}

      {selectedSection === "rota-breaks" ? (
      <CollapsibleSection title="Rota and breaks" subtitle="Select one staff member and edit a compact weekly rota." defaultOpen>
        <StaffRotaEditor industrySlug={template.slug} staffMembers={staffMembers} />
      </CollapsibleSection>
      ) : null}

      {selectedSection === "closures" ? (
      <CollapsibleSection title="Ad hoc closures" subtitle="Closure dates feed booking availability." defaultOpen>
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
      ) : null}

      {selectedSection === "gift-vouchers" ? (
      <CollapsibleSection title="Gift vouchers" subtitle="Enable vouchers and configure delivery methods." defaultOpen>
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
      ) : null}

      {selectedSection === "page-content" ? (
      <CollapsibleSection title="Page visibility/content" subtitle="Enable pages and edit About/Contact/Policy content shown on the demo site." defaultOpen>
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
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
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              Contact page is always visible.
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.pageVisibility.policy.enabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    pageVisibility: {
                      ...current.pageVisibility,
                      policy: { ...current.pageVisibility.policy, enabled: event.target.checked },
                    },
                  }))
                }
              />
              Enable Policy page
            </label>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">About page content</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">About page mode
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.mode}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: {
                          ...current.pageContent.about,
                          mode: event.target.value as "GENERAL" | "STAFF_PROFILES",
                        },
                      },
                    }))
                  }
                >
                  <option value="GENERAL">General About Us</option>
                  <option value="STAFF_PROFILES">Staff profiles</option>
                </select>
              </label>
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
                  <option value="BELOW_TEXT">Images below text</option>
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
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Second image placeholder or URL (optional)
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.about.imageUrlSecondary ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        about: {
                          ...current.pageContent.about,
                          imageUrlSecondary: event.target.value || undefined,
                        },
                      },
                    }))
                  }
                />
              </label>
              {settings.pageContent.about.mode === "STAFF_PROFILES" ? (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Staff profile entries</p>
                  <div className="grid gap-2">
                    {settings.pageContent.about.staffProfiles.map((profile) => (
                      <div key={profile.id} className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                            placeholder="Staff name"
                            value={profile.name}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                pageContent: {
                                  ...current.pageContent,
                                  about: {
                                    ...current.pageContent.about,
                                    staffProfiles: current.pageContent.about.staffProfiles.map((item) =>
                                      item.id === profile.id ? { ...item, name: event.target.value } : item,
                                    ),
                                  },
                                },
                              }))
                            }
                          />
                          <input
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                            placeholder="Role/position"
                            value={profile.role}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                pageContent: {
                                  ...current.pageContent,
                                  about: {
                                    ...current.pageContent.about,
                                    staffProfiles: current.pageContent.about.staffProfiles.map((item) =>
                                      item.id === profile.id ? { ...item, role: event.target.value } : item,
                                    ),
                                  },
                                },
                              }))
                            }
                          />
                          <textarea
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
                            rows={2}
                            placeholder="Short bio"
                            value={profile.bio}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                pageContent: {
                                  ...current.pageContent,
                                  about: {
                                    ...current.pageContent.about,
                                    staffProfiles: current.pageContent.about.staffProfiles.map((item) =>
                                      item.id === profile.id ? { ...item, bio: event.target.value } : item,
                                    ),
                                  },
                                },
                              }))
                            }
                          />
                          <input
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
                            placeholder="Image placeholder or URL"
                            value={profile.imageUrl ?? ""}
                            onChange={(event) =>
                              setSettings((current) => ({
                                ...current,
                                pageContent: {
                                  ...current.pageContent,
                                  about: {
                                    ...current.pageContent.about,
                                    staffProfiles: current.pageContent.about.staffProfiles.map((item) =>
                                      item.id === profile.id
                                        ? { ...item, imageUrl: event.target.value }
                                        : item,
                                    ),
                                  },
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="text-xs font-semibold text-slate-700">Button text (optional)
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
              <label className="text-xs font-semibold text-slate-700">Button destination (optional)
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
                  <option value="BELOW_TEXT">Images below text</option>
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
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={settings.pageContent.contact.showGoogleMapsLinkFromAddress ?? true}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        contact: {
                          ...current.pageContent.contact,
                          showGoogleMapsLinkFromAddress: event.target.checked,
                        },
                      },
                    }))
                  }
                />
                Show Google Maps link from business address
              </label>
              <label className="text-xs font-semibold text-slate-700">Button text (optional)
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
              <label className="text-xs font-semibold text-slate-700">Button destination (optional)
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

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Policy page content</p>
            <div className="mt-2 grid gap-2">
              <label className="text-xs font-semibold text-slate-700">Policy page title
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.policy.title}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        policy: { ...current.pageContent.policy, title: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">Policy intro/body
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.pageContent.policy.body}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      pageContent: {
                        ...current.pageContent,
                        policy: { ...current.pageContent.policy, body: event.target.value },
                      },
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>
      ) : null}

      {selectedSection === "policies" ? (
      <CollapsibleSection title="Policies" subtitle="Set cancellation and refund notice rules for this business." defaultOpen>
        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.policySettings.cancellationEnabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  policySettings: {
                    ...current.policySettings,
                    cancellationEnabled: event.target.checked,
                  },
                }))
              }
            />
            Enable cancellation policy
          </label>

          <label className="text-xs font-semibold text-slate-700">
            Full refund notice period
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.policySettings.fullRefundNoticeDays}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  policySettings: {
                    ...current.policySettings,
                    fullRefundNoticeDays: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                  },
                }))
              }
            >
              <option value={1}>1 day before appointment</option>
              <option value={2}>2 days before appointment</option>
              <option value={3}>3 days before appointment</option>
              <option value={4}>4 days before appointment</option>
              <option value={5}>5 days before appointment</option>
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-700">
            No refund rule
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.policySettings.noRefundWithinDays}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  policySettings: {
                    ...current.policySettings,
                    noRefundWithinDays: Number(event.target.value) as 0 | 1 | 2 | 3 | 4 | 5,
                  },
                }))
              }
            >
              <option value={0}>same day of appointment</option>
              <option value={1}>within 1 day of appointment</option>
              <option value={2}>within 2 days of appointment</option>
              <option value={3}>within 3 days of appointment</option>
              <option value={4}>within 4 days of appointment</option>
              <option value={5}>within 5 days of appointment</option>
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-700">
            Custom policy note (optional)
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.policySettings.customPolicyNote ?? ""}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  policySettings: {
                    ...current.policySettings,
                    customPolicyNote: event.target.value,
                  },
                }))
              }
            />
          </label>
        </div>
      </CollapsibleSection>
      ) : null}

      {selectedSection === "payments" ? (
      <CollapsibleSection title="Payment settings" subtitle="Demo-safe payment setup choices and manual sales recording preferences." defaultOpen>
        <div className="mb-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-semibold text-slate-700">
            Payment setup mode
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={settings.paymentSettings.paymentProcessorSetupMode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  paymentSettings: {
                    ...current.paymentSettings,
                    paymentProcessorSetupMode: event.target.value as
                      | "EXISTING_PROCESSOR"
                      | "NEED_HELP_SETUP"
                      | "MANUAL_RECORDING_ONLY",
                  },
                }))
              }
            >
              <option value="EXISTING_PROCESSOR">I already have a payment processor</option>
              <option value="NEED_HELP_SETUP">I would like help setting one up</option>
              <option value="MANUAL_RECORDING_ONLY">
                I don&apos;t need an online payment processor
              </option>
            </select>
          </label>

          {settings.paymentSettings.paymentProcessorSetupMode ===
          "EXISTING_PROCESSOR" ? (
            <>
              <label className="text-xs font-semibold text-slate-700">
                Provider
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={settings.paymentSettings.processorProvider ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paymentSettings: {
                        ...current.paymentSettings,
                        processorProvider: (event.target.value || undefined) as
                          | "STRIPE"
                          | "SQUARE"
                          | "SUMUP"
                          | "PAYPAL"
                          | "WORLDPAY"
                          | "ZETTLE"
                          | "OTHER"
                          | undefined,
                      },
                    }))
                  }
                >
                  <option value="">Select provider</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="SQUARE">Square</option>
                  <option value="SUMUP">SumUp</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="WORLDPAY">Worldpay</option>
                  <option value="ZETTLE">Zettle</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950 sm:col-span-2">
                {settings.paymentSettings.processorProvider === "STRIPE" ? (
                  <>
                    <p className="font-semibold">Connect Stripe</p>
                    <p className="mt-1">
                      In the real business admin, Stripe opens a secure Stripe-hosted onboarding page. This demo does not connect a live provider and never asks for passwords, API keys or secret codes.
                    </p>
                    <button type="button" className="mt-2 rounded-md border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
                      Demo only - Stripe connection disabled
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Assisted provider setup</p>
                    <p className="mt-1">
                      This provider would be handled with MyExperiment.club support. The real business admin can submit a help request instead of collecting technical credentials here.
                    </p>
                  </>
                )}
              </div>
            </>
          ) : null}

          {settings.paymentSettings.paymentProcessorSetupMode === "NEED_HELP_SETUP" ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950">
              <p className="font-semibold">Ask MyExperiment.club to help with payments</p>
              <p className="mt-1">
                Tell us what you need and we will help you choose or connect the right payment provider. In the live business admin, this message goes to MyExperiment.club support, not to customers.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-sky-200 bg-white p-3">
                  <a href="https://squareup.com/i/DC9E585AB0" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-950 underline">
                    Square
                  </a>
                  <p className="mt-1 text-sky-900">Often a good fit if you want card readers, in-person payments and straightforward online payment options.</p>
                </div>
                <div className="rounded-md border border-sky-200 bg-white p-3">
                  <a href="https://www.stripe.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-950 underline">
                    Stripe
                  </a>
                  <p className="mt-1 text-sky-900">Strong for online card payments and website checkout. If you already use Stripe, you can connect it securely when ready.</p>
                </div>
              </div>
              <label className="mt-3 block text-xs font-semibold text-sky-950">
                Demo help message
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                  placeholder="For example: I'm not sure whether Square or Stripe is better, or I already have Stripe and need help connecting it."
                  value={settings.paymentSettings.processorSetupNotes ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      paymentSettings: {
                        ...current.paymentSettings,
                        processorSetupNotes: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <button type="button" className="mt-2 rounded-md bg-sky-700 px-3 py-1 text-xs font-semibold text-white">
                Demo only - submit help request
              </button>
            </div>
          ) : null}

          {settings.paymentSettings.paymentProcessorSetupMode === "MANUAL_RECORDING_ONLY" ? (
            <div className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
              You can record cash, card terminal or other manual payments in the system. Online checkout will stay off.
            </div>
          ) : null}
          <p className="text-xs text-slate-600">
            This does not connect a payment provider yet. It records how the business plans to
            take payments and helps prepare setup.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={settings.paymentSettings.allowInStorePaymentRecording} onChange={(event) => setSettings((current) => ({ ...current, paymentSettings: { ...current.paymentSettings, allowInStorePaymentRecording: event.target.checked } }))} />
          Allow staff to record in-store/manual sales
        </label>
        <p className="mt-1 text-xs text-slate-600">
          When enabled, staff can record cash, card-terminal or other manual payments
          in Staff View and assign the sale to themselves for finance and staff
          performance reporting. This does not process payments.
        </p>
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(settings.paymentSettings.recurringPaymentsEnabled)} onChange={(event) => setSettings((current) => ({ ...current, paymentSettings: { ...current.paymentSettings, recurringPaymentsEnabled: event.target.checked } }))} />
          Enable recurring services/payments options
        </label>
        <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
          Card, cash and manual payment preferences can be configured here for this
          demo setup. Live provider processing is not connected in this view.
          <a
            href={`/demo/${template.slug}/staff`}
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-semibold text-sky-700 underline-offset-2 hover:underline"
          >
            Open Staff View
          </a>
        </div>
        <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Recurring payment issues</p>
          <p className="mt-1">No failed recurring payments to review.</p>
        </div>
        <p className="mt-2 text-xs text-slate-600">Shows a staff tool for recording cash, card-terminal or other manual payments taken in store. This does not process payments, but allows for accurate finance and staff performance reporting.</p>
      </CollapsibleSection>
      ) : null}

      {selectedSection === "super-user" ? (
      <CollapsibleSection title="Super-user permissions" subtitle="Choose which areas delegated users can access." defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {permissionAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"><input type="checkbox" checked={Boolean(superUserPermissions[area])} onChange={(event) => setSuperUserPermissions((current) => ({ ...current, [area]: event.target.checked }))} />{area}</label>
          ))}
        </div>
      </CollapsibleSection>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800" onClick={persistSettings}>Save business settings</button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </DemoSitePageShell>
  );
}





