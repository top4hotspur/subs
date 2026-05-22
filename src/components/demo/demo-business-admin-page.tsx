"use client";

import { useMemo, useState } from "react";
import { StaffRotaEditor } from "@/components/calendar/staff-rota-editor";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
import { WEEKDAYS } from "@/lib/calendar/calendar-types";
import {
  listLocalBusinessClosures,
  saveLocalBusinessClosures,
} from "@/lib/calendar/local-closures";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import {
  getLocalCustomerSiteSettings,
  saveLocalCustomerSiteSettings,
} from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import {
  listLocalStaff,
  saveLocalStaff,
} from "@/lib/staff/local-staff";
import {
  listLocalStaffRoles,
  saveLocalStaffRoles,
  seedLocalStaffRoles,
  type StaffRoleDefinition,
} from "@/lib/staff/staff-role-settings";
import {
  StaffAvailabilityMode,
  StaffRoleType,
  type StaffMember,
} from "@/lib/staff/staff-types";
import { formatUkDate, weekdayLabel } from "@/lib/ui/display-labels";
import {
  getLocalVoucherSettings,
  saveLocalVoucherSettings,
} from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

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

function makeRoleId(): string {
  return `role_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function summarizeDays(days?: string[]): string {
  if (!days || days.length === 0) return "No days selected";
  return days.map((d) => weekdayLabel(d as never)).join(", ");
}

export function DemoBusinessAdminPage({ template }: DemoBusinessAdminPageProps) {
  const initialSettings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const [settings, setSettings] = useState(initialSettings);
  const [voucherSettings, setVoucherSettings] = useState(getLocalVoucherSettings(template.slug));
  const [staffMembers, setStaffMembers] = useState(listLocalStaff(template.slug));
  const [closures, setClosures] = useState(listLocalBusinessClosures(template.slug));
  const [roles, setRoles] = useState<StaffRoleDefinition[]>(() => {
    const existing = listLocalStaffRoles(template.slug);
    return existing.length > 0 ? existing : seedLocalStaffRoles(template.slug);
  });
  const activeRoles = roles.filter((role) => role.active);

  const [superUserPermissions, setSuperUserPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(permissionAreas.map((area) => [area, true])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [newClosureDate, setNewClosureDate] = useState("");
  const [newClosureLabel, setNewClosureLabel] = useState("");
  const [newRoleLabel, setNewRoleLabel] = useState("");
  const [expandedServiceIds, setExpandedServiceIds] = useState<string[]>([]);
  const [expandedStaffIds, setExpandedStaffIds] = useState<string[]>([]);

  function persistSettings(): void {
    saveLocalCustomerSiteSettings(settings);
    saveLocalVoucherSettings(template.slug, voucherSettings);
    saveLocalStaff(template.slug, staffMembers);
    saveLocalBusinessClosures(template.slug, closures);
    saveLocalStaffRoles(template.slug, roles);
    setMessage("Business site settings saved.");
  }

  function toggleServiceExpanded(serviceId: string): void {
    setExpandedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function toggleStaffExpanded(staffId: string): void {
    setExpandedStaffIds((current) =>
      current.includes(staffId)
        ? current.filter((id) => id !== staffId)
        : [...current, staffId],
    );
  }

  function addService(): void {
    const id = makeServiceId();
    setSettings((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id,
          name: "New service",
          description: "",
          basePriceGbp: 0,
          durationMinutes: 45,
          bufferAfterMinutes: 0,
          bookable: true,
          requiresQuote: false,
          active: true,
        },
      ],
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
    setRoles((current) => [
      ...current,
      { id: makeRoleId(), label, active: true, createdAtIso: now, updatedAtIso: now },
    ]);
    setNewRoleLabel("");
  }

  function updateRoleLabel(roleId: string, label: string): void {
    setRoles((current) =>
      current.map((role) =>
        role.id === roleId
          ? { ...role, label, updatedAtIso: new Date().toISOString() }
          : role,
      ),
    );
  }

  function removeRole(roleId: string): void {
    setRoles((current) =>
      current.map((role) =>
        role.id === roleId
          ? { ...role, active: false, updatedAtIso: new Date().toISOString() }
          : role,
      ),
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Business admin portal</p>
        <h1 className="mt-2 text-3xl font-bold">Site owner control centre</h1>
        <p className="mt-2 text-sm text-slate-200">Manage services, staff setup, booking preferences, vouchers, pages, and team permissions.</p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <SiteCard title="Staff positions" subtitle="Create business-specific role/position options used by staff records.">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            placeholder="Add position"
            value={newRoleLabel}
            onChange={(event) => setNewRoleLabel(event.target.value)}
          />
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addRole}>
            Add position
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeRoles.map((role) => (
            <div key={role.id} className="rounded-md border border-slate-200 bg-white p-2">
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={role.label}
                  onChange={(event) => updateRoleLabel(role.id, event.target.value)}
                />
                <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => removeRole(role.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </SiteCard>

      <SiteCard title="Services and prices" subtitle="Compact service cards with duration and role pricing.">
        <div className="mb-3">
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addService}>
            Add service
          </button>
        </div>
        <div className="grid gap-3">
          {settings.services.map((service, index) => {
            const expanded = expandedServiceIds.includes(service.id);
            return (
              <div key={service.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    <p className="text-xs text-slate-600">
                      {getPublicServicePriceLabel(service) || "Quote required"} • {service.durationMinutes ?? 45} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => toggleServiceExpanded(service.id)}>
                      {expanded ? "Collapse" : "Edit"}
                    </button>
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
                      Remove
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                          next[index] = { ...next[index], basePriceGbp: value ? Number(value) : undefined };
                          return { ...current, services: next };
                        })
                      }
                    />
                    <input
                      type="number"
                      min={10}
                      step="5"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={service.durationMinutes ?? 45}
                      placeholder="Duration (minutes)"
                      onChange={(event) =>
                        setSettings((current) => {
                          const next = [...current.services];
                          next[index] = { ...next[index], durationMinutes: Number(event.target.value || 45) };
                          return { ...current, services: next };
                        })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      step="5"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={service.bufferAfterMinutes ?? 0}
                      placeholder="Buffer after (minutes)"
                      onChange={(event) =>
                        setSettings((current) => {
                          const next = [...current.services];
                          next[index] = { ...next[index], bufferAfterMinutes: Number(event.target.value || 0) };
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

                    {activeRoles.length > 0 ? (
                      <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-semibold text-slate-700">Role pricing overrides</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {activeRoles.map((role) => {
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
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </SiteCard>

      <SiteCard title="Staff" subtitle="Compact staff cards with role dropdown and available days.">
        <div className="mb-3">
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addStaff}>
            Add staff member
          </button>
        </div>
        <div className="grid gap-3">
          {staffMembers.map((staff, index) => {
            const expanded = expandedStaffIds.includes(staff.id);
            return (
              <div key={staff.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{staff.displayName}</p>
                    <p className="text-xs text-slate-600">
                      {staff.roleLabel || "Position not set"} • {summarizeDays(staff.availableWeekdays)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{staff.active ? "Active" : "Inactive"}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{staff.customerSelectable ? "Customer-selectable" : "Hidden from customers"}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{staff.isSuperUser ? "Super user" : "Standard user"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-semibold text-sky-700" onClick={() => toggleStaffExpanded(staff.id)}>
                      {expanded ? "Collapse" : "Edit"}
                    </button>
                    <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setStaffMembers((current) => current.filter((item) => item.id !== staff.id))}>
                      Remove
                    </button>
                  </div>
                </div>

                {expanded ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={staff.displayName}
                      onChange={(event) => {
                        const next = [...staffMembers];
                        next[index] = { ...next[index], displayName: event.target.value };
                        setStaffMembers(next);
                      }}
                    />
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={staff.roleLabel ?? ""}
                      onChange={(event) => {
                        const next = [...staffMembers];
                        next[index] = { ...next[index], roleLabel: event.target.value };
                        setStaffMembers(next);
                      }}
                    >
                      <option value="">Select position</option>
                      {activeRoles.map((role) => (
                        <option key={role.id} value={role.label}>{role.label}</option>
                      ))}
                    </select>
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

                    <div className="sm:col-span-2 flex flex-wrap gap-3 text-xs text-slate-700">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={staff.active} onChange={(event) => {
                          const next = [...staffMembers];
                          next[index] = { ...next[index], active: event.target.checked };
                          setStaffMembers(next);
                        }} /> Active
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={staff.customerSelectable} onChange={(event) => {
                          const next = [...staffMembers];
                          next[index] = { ...next[index], customerSelectable: event.target.checked };
                          setStaffMembers(next);
                        }} /> Customer-selectable
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" checked={Boolean(staff.isSuperUser)} onChange={(event) => {
                          const next = [...staffMembers];
                          next[index] = { ...next[index], isSuperUser: event.target.checked };
                          setStaffMembers(next);
                        }} /> Super user
                      </label>
                    </div>

                    <div className="sm:col-span-2">
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
                ) : null}
              </div>
            );
          })}
        </div>
      </SiteCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SiteCard title="Ad hoc closures" subtitle="Closure dates feed booking availability.">
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={newClosureDate} onChange={(event) => setNewClosureDate(event.target.value)} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Closure label" value={newClosureLabel} onChange={(event) => setNewClosureLabel(event.target.value)} />
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
                <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => setClosures((current) => current.filter((item) => item.id !== closure.id))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </SiteCard>

        <SiteCard title="Gift vouchers" subtitle="Enable vouchers and configure delivery methods.">
          <div className="space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={voucherSettings.enabled} onChange={(event) => setVoucherSettings((current) => ({ ...current, enabled: event.target.checked }))} />
              Enable gift vouchers
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={voucherSettings.allowCustomValue} onChange={(event) => setVoucherSettings((current) => ({ ...current, allowCustomValue: event.target.checked }))} />
              Allow customer-entered voucher values
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Min value (£)
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.minValueGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, minValueGbp: Number(event.target.value || 0) }))} />
              </label>
              <label className="text-xs">Max value (£)
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.maxValueGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, maxValueGbp: Number(event.target.value || 0) }))} />
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
            <label className="text-xs">Postage charge (£)
              <input type="number" step="0.5" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={voucherSettings.postageChargeGbp} onChange={(event) => setVoucherSettings((current) => ({ ...current, postageChargeGbp: Number(event.target.value || 0) }))} />
            </label>
          </div>
        </SiteCard>
      </div>

      <SiteCard title="Staff rota" subtitle="Select one staff member and edit a compact weekly rota. Service availability days control rota eligibility.">
        <StaffRotaEditor industrySlug={template.slug} staffMembers={staffMembers} />
      </SiteCard>

      <SiteCard title="Super-user permissions model" subtitle="Choose which areas delegated users can access.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {permissionAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(superUserPermissions[area])}
                onChange={(event) => setSuperUserPermissions((current) => ({ ...current, [area]: event.target.checked }))}
              />
              {area}
            </label>
          ))}
        </div>
      </SiteCard>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800" onClick={persistSettings}>
          Save business settings
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}
