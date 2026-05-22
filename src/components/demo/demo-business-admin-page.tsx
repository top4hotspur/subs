"use client";

import { useMemo, useState } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
import { StaffRotaEditor } from "@/components/calendar/staff-rota-editor";
import {
  listLocalBusinessClosures,
  saveLocalBusinessClosures,
} from "@/lib/calendar/local-closures";
import { WEEKDAYS } from "@/lib/calendar/calendar-types";
import {
  getLocalCustomerSiteSettings,
  saveLocalCustomerSiteSettings,
} from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import {
  listLocalStaff,
  saveLocalStaff,
} from "@/lib/staff/local-staff";
import { listLocalStaffRoles } from "@/lib/staff/staff-role-settings";
import { StaffAvailabilityMode, StaffRoleType, type StaffMember } from "@/lib/staff/staff-types";
import {
  getLocalVoucherSettings,
  saveLocalVoucherSettings,
} from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";
import { formatUkDate, weekdayLabel } from "@/lib/ui/display-labels";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";

type DemoBusinessAdminPageProps = {
  template: WebsiteTemplate;
};

const permissionAreas = [
  "staff",
  "rotas",
  "bookings",
  "financials",
  "services",
  "vouchers",
  "pages",
  "notifications",
] as const;

function makeServiceId(): string {
  return `service_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeStaffId(): string {
  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function DemoBusinessAdminPage({ template }: DemoBusinessAdminPageProps) {
  const initialSettings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const [settings, setSettings] = useState(initialSettings);
  const [voucherSettings, setVoucherSettings] = useState(
    getLocalVoucherSettings(template.slug),
  );
  const [staffMembers, setStaffMembers] = useState(listLocalStaff(template.slug));
  const [closures, setClosures] = useState(listLocalBusinessClosures(template.slug));
  const roleDefinitions = useMemo(() => listLocalStaffRoles(template.slug).filter((role) => role.active), [template.slug]);
  const [superUserPermissions, setSuperUserPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(permissionAreas.map((area) => [area, true])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureLabel, setNewClosureLabel] = useState("");

  function persistSettings(): void {
    saveLocalCustomerSiteSettings(settings);
    saveLocalVoucherSettings(template.slug, voucherSettings);
    saveLocalStaff(template.slug, staffMembers);
    saveLocalBusinessClosures(template.slug, closures);
    setMessage("Business site settings saved.");
  }

  function addService(): void {
    setSettings((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: makeServiceId(),
          name: "New service",
          description: "",
          basePriceGbp: 0,
          durationMinutes: 45,
          bookable: true,
          requiresQuote: false,
          active: true,
        },
      ],
    }));
  }

  function addStaff(): void {
    const now = new Date().toISOString();
    const roleLabel = roleDefinitions[0]?.label ?? "Team Member";
    const next: StaffMember = {
      id: makeStaffId(),
      displayName: "New staff member",
      role: StaffRoleType.GENERAL_STAFF,
      roleLabel,
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
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Business admin portal</p>
        <h1 className="mt-2 text-3xl font-bold">Site owner control centre</h1>
        <p className="mt-2 text-sm text-slate-200">
          Manage services, staff setup, booking preferences, vouchers, pages, and team permissions.
        </p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <SiteCard title="Services and prices" subtitle="Edit names, descriptions and prices shown on the public site.">
        <div className="mb-3">
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addService}>
            Add service
          </button>
        </div>
        <div className="space-y-3">
          {settings.services.map((service, index) => (
            <div key={service.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Service #{index + 1}</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-700"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      services: current.services.filter((item) => item.id !== service.id),
                    }))
                  }
                >
                  Remove service
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={service.name}
                  onChange={(event) =>
                    setSettings((current) => {
                      const next = [...current.services];
                      next[index] = { ...next[index], name: event.target.value };
                      return { ...current, services: next };
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={service.basePriceGbp ?? ""}
                  placeholder="Base price (£)"
                  onChange={(event) =>
                    setSettings((current) => {
                      const next = [...current.services];
                      const value = event.target.value.trim();
                      next[index] = {
                        ...next[index],
                        basePriceGbp: value ? Number(value) : undefined,
                      };
                      return { ...current, services: next };
                    })
                  }
                />
                <textarea
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
                  value={service.description}
                  placeholder="Description (optional)"
                  onChange={(event) =>
                    setSettings((current) => {
                      const next = [...current.services];
                      next[index] = { ...next[index], description: event.target.value };
                      return { ...current, services: next };
                    })
                  }
                />
              </div>
              {roleDefinitions.length > 0 ? (
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-slate-700">Role pricing overrides</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {roleDefinitions.map((role) => {
                      const currentOverride = service.rolePriceOverrides?.find((item) => item.roleLabel === role.label);
                      return (
                        <label key={role.id} className="text-xs text-slate-700">
                          {role.label} (£)
                          <input
                            type="number"
                            min={0}
                            step="1"
                            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                            value={currentOverride?.priceGbp ?? ""}
                            placeholder="Use base price"
                            onChange={(event) => {
                              const value = event.target.value.trim();
                              setSettings((current) => {
                                const next = [...current.services];
                                const overrides = [...(next[index].rolePriceOverrides ?? [])].filter(
                                  (item) => item.roleLabel !== role.label,
                                );
                                if (value) {
                                  overrides.push({ roleId: role.id, roleLabel: role.label, priceGbp: Number(value) });
                                }
                                next[index] = {
                                  ...next[index],
                                  rolePriceOverrides: overrides.length > 0 ? overrides : undefined,
                                };
                                return { ...current, services: next };
                              });
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <p className="mt-2 text-xs font-semibold text-slate-700">Public display: {getPublicServicePriceLabel(service) || "Quote required"}</p>
            </div>
          ))}
        </div>
      </SiteCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SiteCard title="Staff" subtitle="Maintain team contact details, access level, and booking visibility.">
          <div className="mb-3">
            <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addStaff}>
              Add staff member
            </button>
          </div>
          <div className="space-y-3">
            {staffMembers.map((staff, index) => (
              <div key={staff.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Staff #{index + 1}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-700"
                    onClick={() => setStaffMembers((current) => current.filter((item) => item.id !== staff.id))}
                  >
                    Remove staff
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={staff.displayName}
                    onChange={(event) => {
                      const next = [...staffMembers];
                      next[index] = { ...next[index], displayName: event.target.value };
                      setStaffMembers(next);
                    }}
                  />
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Position"
                    value={staff.roleLabel ?? ""}
                    onChange={(event) => {
                      const next = [...staffMembers];
                      next[index] = { ...next[index], roleLabel: event.target.value };
                      setStaffMembers(next);
                    }}
                  />
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Phone"
                    value={staff.phone ?? ""}
                    onChange={(event) => {
                      const next = [...staffMembers];
                      next[index] = { ...next[index], phone: event.target.value || undefined };
                      setStaffMembers(next);
                    }}
                  />
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    placeholder="Email"
                    value={staff.email ?? ""}
                    onChange={(event) => {
                      const next = [...staffMembers];
                      next[index] = { ...next[index], email: event.target.value || undefined };
                      setStaffMembers(next);
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-700">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={staff.active}
                      onChange={(event) => {
                        const next = [...staffMembers];
                        next[index] = { ...next[index], active: event.target.checked };
                        setStaffMembers(next);
                      }}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={staff.customerSelectable}
                      onChange={(event) => {
                        const next = [...staffMembers];
                        next[index] = { ...next[index], customerSelectable: event.target.checked };
                        setStaffMembers(next);
                      }}
                    />
                    Customer-selectable
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={Boolean(staff.isSuperUser)}
                      onChange={(event) => {
                        const next = [...staffMembers];
                        next[index] = { ...next[index], isSuperUser: event.target.checked };
                        setStaffMembers(next);
                      }}
                    />
                    Super user
                  </label>
                </div>
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-700">Available working days</p>
                  <div className="mt-1 grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
                    {WEEKDAYS.map((day) => {
                      const selected = (staff.availableWeekdays ?? []).includes(day);
                      return (
                        <label key={day} className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const current = staff.availableWeekdays ?? [];
                              const updated = event.target.checked
                                ? [...current, day]
                                : current.filter((item) => item !== day);
                              const next = [...staffMembers];
                              next[index] = { ...next[index], availableWeekdays: updated };
                              setStaffMembers(next);
                            }}
                          />
                          {weekdayLabel(day)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SiteCard>

        <SiteCard title="Ad hoc closures" subtitle="Closure dates feed booking availability.">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={newClosureDate}
              onChange={(event) => setNewClosureDate(event.target.value)}
            />
            <input
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="Closure label"
              value={newClosureLabel}
              onChange={(event) => setNewClosureLabel(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="mt-2 rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            onClick={() => {
              if (!newClosureDate) return;
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
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {closures.length === 0 ? <li>No closures added.</li> : null}
            {closures.map((closure) => (
              <li key={closure.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
                <span>{formatUkDate(closure.date)} - {closure.label}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-700"
                  onClick={() => setClosures((current) => current.filter((item) => item.id !== closure.id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </SiteCard>
      </div>

      <SiteCard title="Staff rota" subtitle="Working hours and breaks for appointment availability. Staff can only be rota’d on selected available days.">
        <StaffRotaEditor industrySlug={template.slug} staffMembers={staffMembers} />
      </SiteCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SiteCard title="Gift vouchers" subtitle="Enable vouchers and configure delivery methods.">
          <div className="space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voucherSettings.enabled}
                onChange={(event) =>
                  setVoucherSettings((current) => ({ ...current, enabled: event.target.checked }))
                }
              />
              Enable gift vouchers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voucherSettings.allowCustomValue}
                onChange={(event) =>
                  setVoucherSettings((current) => ({ ...current, allowCustomValue: event.target.checked }))
                }
              />
              Allow customer-entered voucher values
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Min value (£)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={voucherSettings.minValueGbp}
                  onChange={(event) =>
                    setVoucherSettings((current) => ({
                      ...current,
                      minValueGbp: Number(event.target.value || 0),
                    }))
                  }
                />
              </label>
              <label className="text-xs">
                Max value (£)
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={voucherSettings.maxValueGbp}
                  onChange={(event) =>
                    setVoucherSettings((current) => ({
                      ...current,
                      maxValueGbp: Number(event.target.value || 0),
                    }))
                  }
                />
              </label>
            </div>
            <div className="space-y-1 text-xs">
              {[VoucherDeliveryMethod.DIGITAL_EMAIL, VoucherDeliveryMethod.COLLECT_IN_STORE, VoucherDeliveryMethod.POST].map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voucherSettings.deliveryMethods.includes(method)}
                    onChange={(event) =>
                      setVoucherSettings((current) => ({
                        ...current,
                        deliveryMethods: event.target.checked
                          ? [...current.deliveryMethods, method]
                          : current.deliveryMethods.filter((item) => item !== method),
                      }))
                    }
                  />
                  {method}
                </label>
              ))}
            </div>
            <label className="text-xs">
              Postage charge (£)
              <input
                type="number"
                step="0.5"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={voucherSettings.postageChargeGbp}
                onChange={(event) =>
                  setVoucherSettings((current) => ({
                    ...current,
                    postageChargeGbp: Number(event.target.value || 0),
                  }))
                }
              />
            </label>
          </div>
        </SiteCard>

        <SiteCard title="Page visibility and content" subtitle="Enable pages and maintain core About/Contact content.">
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
            About Us page enabled
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
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
            Contact page enabled
          </label>
          <p className="mt-2 text-xs text-slate-600">
            About and Contact content uses the business profile, service areas, and contact details configured for this site.
          </p>
        </SiteCard>
      </div>

      <SiteCard title="Super-user permissions model" subtitle="Choose which areas delegated users can access.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {permissionAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(superUserPermissions[area])}
                onChange={(event) =>
                  setSuperUserPermissions((current) => ({ ...current, [area]: event.target.checked }))
                }
              />
              {area}
            </label>
          ))}
        </div>
      </SiteCard>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          onClick={persistSettings}
        >
          Save business settings
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}

