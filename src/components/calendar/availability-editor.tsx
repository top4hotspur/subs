"use client";

import { useMemo, useState } from "react";
import {
  AvailabilityWindowType,
  BusinessAvailabilityWindow,
  StaffAvailabilityWindow,
  WEEKDAYS,
  Weekday,
} from "@/lib/calendar/calendar-types";
import {
  clearLocalAvailability,
  listLocalBusinessAvailability,
  listLocalStaffAvailability,
  saveLocalBusinessAvailability,
  saveLocalStaffAvailability,
  seedLocalBusinessAvailability,
  seedLocalStaffAvailability,
} from "@/lib/calendar/local-availability";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { availabilityWindowTypeLabel, weekdayLabel } from "@/lib/ui/display-labels";

type AvailabilityEditorProps = {
  industrySlug: WebsiteTemplateSlug;
  staffMembers: StaffMember[];
  services: SiteServiceItem[];
};

const windowTypes = Object.values(AvailabilityWindowType);

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyBusinessWindow(industrySlug: WebsiteTemplateSlug): BusinessAvailabilityWindow {
  return {
    id: generateId("biz_avail"),
    industrySlug,
    weekday: "monday",
    startTime: "09:00",
    endTime: "17:00",
    type: AvailabilityWindowType.OPEN,
    notes: "",
    active: true,
  };
}

function emptyStaffWindow(staffId: string): StaffAvailabilityWindow {
  return {
    id: generateId("staff_avail"),
    staffId,
    weekday: "monday",
    startTime: "09:00",
    endTime: "17:00",
    type: AvailabilityWindowType.OPEN,
    notes: "",
    active: true,
  };
}

export function AvailabilityEditor({ industrySlug, staffMembers, services }: AvailabilityEditorProps) {
  const [businessWindows, setBusinessWindows] = useState<BusinessAvailabilityWindow[]>(() =>
    listLocalBusinessAvailability(industrySlug),
  );
  const [staffWindows, setStaffWindows] = useState<StaffAvailabilityWindow[]>(() =>
    listLocalStaffAvailability(industrySlug),
  );

  const activeServicesCount = useMemo(
    () => services.filter((service) => service.active).length,
    [services],
  );

  function reload() {
    setBusinessWindows(listLocalBusinessAvailability(industrySlug));
    setStaffWindows(listLocalStaffAvailability(industrySlug));
  }

  function saveBusiness(next: BusinessAvailabilityWindow[]) {
    setBusinessWindows(saveLocalBusinessAvailability(industrySlug, next));
  }

  function saveStaff(next: StaffAvailabilityWindow[]) {
    setStaffWindows(saveLocalStaffAvailability(industrySlug, next));
  }

  function updateBusinessWindow(id: string, patch: Partial<BusinessAvailabilityWindow>) {
    saveBusiness(businessWindows.map((window) => (window.id === id ? { ...window, ...patch } : window)));
  }

  function updateStaffWindow(id: string, patch: Partial<StaffAvailabilityWindow>) {
    saveStaff(staffWindows.map((window) => (window.id === id ? { ...window, ...patch } : window)));
  }

  function addBusinessWindow() {
    saveBusiness([...businessWindows, emptyBusinessWindow(industrySlug)]);
  }

  function duplicateBusinessWindow(window: BusinessAvailabilityWindow) {
    saveBusiness([...businessWindows, { ...window, id: generateId("biz_avail") }]);
  }

  function removeBusinessWindow(id: string) {
    if (!window.confirm("Remove this business availability window?")) {
      return;
    }
    saveBusiness(businessWindows.filter((window) => window.id !== id));
  }

  function addStaffWindow(staffId: string) {
    saveStaff([...staffWindows, emptyStaffWindow(staffId)]);
  }

  function duplicateStaffWindow(window: StaffAvailabilityWindow) {
    saveStaff([...staffWindows, { ...window, id: generateId("staff_avail") }]);
  }

  function removeStaffWindow(id: string) {
    if (!window.confirm("Remove this staff availability window?")) {
      return;
    }
    saveStaff(staffWindows.filter((window) => window.id !== id));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Availability & scheduling</h2>
          <p className="text-xs text-slate-600">
            Local-only scheduling windows. No conflict-checking or live calendar sync yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">Active services linked: {activeServicesCount}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${secondaryButtonClass} ${smallButtonClass}`}
            onClick={() => {
              const seeded = seedLocalBusinessAvailability(industrySlug);
              setBusinessWindows(seeded);
            }}
          >
            Seed business defaults
          </button>
          <button
            type="button"
            className={`${secondaryButtonClass} ${smallButtonClass}`}
            onClick={() => {
              const seeded = seedLocalStaffAvailability(industrySlug);
              setStaffWindows(seeded);
            }}
          >
            Seed staff defaults
          </button>
          <button
            type="button"
            className={`${dangerButtonClass} ${smallButtonClass}`}
            onClick={() => {
              if (!window.confirm("Clear all local availability for this industry?")) return;
              clearLocalAvailability(industrySlug);
              reload();
            }}
          >
            Clear availability
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Business availability windows</h3>
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={addBusinessWindow}>
            Add window
          </button>
        </div>

        {businessWindows.length === 0 ? (
          <p className="text-xs text-slate-600">No business windows yet. Seed defaults or add a window.</p>
        ) : (
          businessWindows.map((window) => (
            <article key={window.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-5">
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={window.weekday}
                  onChange={(event) => updateBusinessWindow(window.id, { weekday: event.target.value as Weekday })}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>{weekdayLabel(day)}</option>
                  ))}
                </select>
                <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.startTime} onChange={(event) => updateBusinessWindow(window.id, { startTime: event.target.value })} />
                <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.endTime} onChange={(event) => updateBusinessWindow(window.id, { endTime: event.target.value })} />
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={window.type}
                  onChange={(event) => updateBusinessWindow(window.id, { type: event.target.value as AvailabilityWindowType })}
                >
                  {windowTypes.map((type) => (
                    <option key={type} value={type}>{availabilityWindowTypeLabel(type)}</option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={window.active} onChange={(event) => updateBusinessWindow(window.id, { active: event.target.checked })} />
                  Active
                </label>
              </div>
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Notes"
                value={window.notes ?? ""}
                onChange={(event) => updateBusinessWindow(window.id, { notes: event.target.value })}
              />
              <div className="mt-2 flex gap-2">
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => duplicateBusinessWindow(window)}>Duplicate</button>
                <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => removeBusinessWindow(window.id)}>Remove</button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Staff availability</h3>
        {staffMembers.length === 0 ? (
          <p className="text-xs text-slate-600">No staff members available. Add staff first to define staff windows.</p>
        ) : (
          staffMembers.map((staff) => {
            const windows = staffWindows.filter((window) => window.staffId === staff.id);
            return (
              <article key={staff.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{staff.displayName}</p>
                  <button
                    type="button"
                    className={`${primaryButtonClass} ${smallButtonClass}`}
                    onClick={() => addStaffWindow(staff.id)}
                  >
                    Add window
                  </button>
                </div>

                {windows.length === 0 ? (
                  <p className="text-xs text-slate-600">No staff windows set.</p>
                ) : (
                  <div className="space-y-2">
                    {windows.map((window) => (
                      <div key={window.id} className="rounded-md border border-slate-200 p-2">
                        <div className="grid gap-2 sm:grid-cols-5">
                          <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.weekday} onChange={(event) => updateStaffWindow(window.id, { weekday: event.target.value as Weekday })}>
                            {WEEKDAYS.map((day) => <option key={day} value={day}>{weekdayLabel(day)}</option>)}
                          </select>
                          <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.startTime} onChange={(event) => updateStaffWindow(window.id, { startTime: event.target.value })} />
                          <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.endTime} onChange={(event) => updateStaffWindow(window.id, { endTime: event.target.value })} />
                          <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={window.type} onChange={(event) => updateStaffWindow(window.id, { type: event.target.value as AvailabilityWindowType })}>
                            {windowTypes.map((type) => <option key={type} value={type}>{availabilityWindowTypeLabel(type)}</option>)}
                          </select>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                            <input type="checkbox" checked={window.active} onChange={(event) => updateStaffWindow(window.id, { active: event.target.checked })} />
                            Active
                          </label>
                        </div>
                        <input className="mt-2 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Notes" value={window.notes ?? ""} onChange={(event) => updateStaffWindow(window.id, { notes: event.target.value })} />
                        <div className="mt-2 flex gap-2">
                          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => duplicateStaffWindow(window)}>Duplicate</button>
                          <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => removeStaffWindow(window.id)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}


