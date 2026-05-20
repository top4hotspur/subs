"use client";

import { useMemo, useState } from "react";
import { StaffBreakWindow, StaffRotaDay, WEEKDAYS, Weekday } from "@/lib/calendar/calendar-types";
import {
  clearLocalStaffRota,
  listLocalStaffRota,
  saveLocalStaffRota,
  seedLocalStaffRota,
  updateLocalStaffRotaForStaff,
} from "@/lib/calendar/local-staff-rota";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { weekdayLabel } from "@/lib/ui/display-labels";

type StaffRotaEditorProps = {
  industrySlug: WebsiteTemplateSlug;
  staffMembers: StaffMember[];
};

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDay(staffId: string, weekday: Weekday): StaffRotaDay {
  return { staffId, weekday, working: false, breaks: [] };
}

export function StaffRotaEditor({ industrySlug, staffMembers }: StaffRotaEditorProps) {
  const [rotaDays, setRotaDays] = useState<StaffRotaDay[]>(() => listLocalStaffRota(industrySlug));

  const byStaff = useMemo(
    () =>
      staffMembers.map((staff) => {
        const staffDays = WEEKDAYS.map(
          (weekday) => rotaDays.find((day) => day.staffId === staff.id && day.weekday === weekday) ?? emptyDay(staff.id, weekday),
        );
        return { staff, days: staffDays };
      }),
    [rotaDays, staffMembers],
  );

  function replaceStaffDays(staffId: string, nextDays: StaffRotaDay[]) {
    const saved = updateLocalStaffRotaForStaff(industrySlug, staffId, nextDays);
    setRotaDays(saved);
  }

  function updateDay(staffId: string, weekday: Weekday, patch: Partial<StaffRotaDay>) {
    const days = WEEKDAYS.map((day) => rotaDays.find((item) => item.staffId === staffId && item.weekday === day) ?? emptyDay(staffId, day));
    const updated = days.map((day) =>
      day.weekday === weekday
        ? {
            ...day,
            ...patch,
            breaks: patch.working === false ? [] : patch.breaks ?? day.breaks,
          }
        : day,
    );
    replaceStaffDays(staffId, updated);
  }

  function addBreak(staffId: string, weekday: Weekday) {
    const target = rotaDays.find((day) => day.staffId === staffId && day.weekday === weekday) ?? {
      ...emptyDay(staffId, weekday),
      working: true,
      startTime: "09:00",
      endTime: "17:00",
      breaks: [],
    };

    const nextBreak: StaffBreakWindow = {
      id: generateId("staff_break"),
      staffId,
      weekday,
      startTime: "12:30",
      endTime: "13:00",
      label: "Break",
      active: true,
    };

    updateDay(staffId, weekday, { working: true, breaks: [...target.breaks, nextBreak] });
  }

  function updateBreak(staffId: string, weekday: Weekday, breakId: string, patch: Partial<StaffBreakWindow>) {
    const target = rotaDays.find((day) => day.staffId === staffId && day.weekday === weekday) ?? emptyDay(staffId, weekday);
    const nextBreaks = target.breaks.map((item) => (item.id === breakId ? { ...item, ...patch } : item));
    updateDay(staffId, weekday, { breaks: nextBreaks });
  }

  function removeBreak(staffId: string, weekday: Weekday, breakId: string) {
    if (!window.confirm("Remove this break window?")) return;
    const target = rotaDays.find((day) => day.staffId === staffId && day.weekday === weekday) ?? emptyDay(staffId, weekday);
    updateDay(staffId, weekday, { breaks: target.breaks.filter((item) => item.id !== breakId) });
  }

  function reload() {
    setRotaDays(listLocalStaffRota(industrySlug));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Staff rota & breaks</h2>
          <p className="text-xs text-slate-600">
            Local mock rota data for future appointment slot generation. Breaks represent blocked time windows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${secondaryButtonClass} ${smallButtonClass}`}
            onClick={() => setRotaDays(seedLocalStaffRota(industrySlug, staffMembers))}
          >
            Seed rota defaults
          </button>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={reload}
          >
            Reload rota
          </button>
          <button
            type="button"
            className={`${dangerButtonClass} ${smallButtonClass}`}
            onClick={() => {
              if (!window.confirm("Clear local staff rota for this industry?")) return;
              clearLocalStaffRota(industrySlug);
              reload();
            }}
          >
            Clear rota
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500">Browser-only mock data. No real conflict checks are performed yet.</p>

      {staffMembers.length === 0 ? (
        <p className="text-sm text-slate-600">No staff members yet. Add staff first, then seed/edit rota.</p>
      ) : (
        <div className="space-y-4">
          {byStaff.map(({ staff, days }) => (
            <article key={staff.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">{staff.displayName}</h3>
              <div className="space-y-3">
                {days.map((day) => (
                  <div key={`${staff.id}_${day.weekday}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-[140px_auto_auto_auto] sm:items-center">
                      <p className="text-xs font-semibold text-slate-700">{weekdayLabel(day.weekday)}</p>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={day.working}
                          onChange={(event) =>
                            updateDay(staff.id, day.weekday, {
                              working: event.target.checked,
                              startTime: event.target.checked ? (day.startTime ?? "09:00") : undefined,
                              endTime: event.target.checked ? (day.endTime ?? "17:00") : undefined,
                            })
                          }
                        />
                        Working
                      </label>
                      <input
                        type="time"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={day.startTime ?? ""}
                        disabled={!day.working}
                        onChange={(event) => updateDay(staff.id, day.weekday, { startTime: event.target.value })}
                      />
                      <input
                        type="time"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={day.endTime ?? ""}
                        disabled={!day.working}
                        onChange={(event) => updateDay(staff.id, day.weekday, { endTime: event.target.value })}
                      />
                    </div>

                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-700">Break windows</p>
                        <button
                          type="button"
                          className={`${primaryButtonClass} ${smallButtonClass}`}
                          disabled={!day.working}
                          onClick={() => addBreak(staff.id, day.weekday)}
                        >
                          Add break
                        </button>
                      </div>

                      {day.breaks.length === 0 ? (
                        <p className="text-xs text-slate-500">No breaks for this day.</p>
                      ) : (
                        <div className="space-y-2">
                          {day.breaks.map((item) => (
                            <div key={item.id} className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_auto_auto_auto]">
                              <input
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                value={item.label ?? ""}
                                placeholder="Break label"
                                onChange={(event) => updateBreak(staff.id, day.weekday, item.id, { label: event.target.value })}
                              />
                              <input
                                type="time"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                value={item.startTime}
                                onChange={(event) => updateBreak(staff.id, day.weekday, item.id, { startTime: event.target.value })}
                              />
                              <input
                                type="time"
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                value={item.endTime}
                                onChange={(event) => updateBreak(staff.id, day.weekday, item.id, { endTime: event.target.value })}
                              />
                              <button
                                type="button"
                                className={`${dangerButtonClass} ${smallButtonClass}`}
                                onClick={() => removeBreak(staff.id, day.weekday, item.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => setRotaDays(saveLocalStaffRota(industrySlug, rotaDays))}
        >
          Save rota
        </button>
      </div>
    </section>
  );
}
