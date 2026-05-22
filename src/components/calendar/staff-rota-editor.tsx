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
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffMembers.find((staff) => staff.active)?.id ?? staffMembers[0]?.id ?? "");
  const [expandedBreakWeekdays, setExpandedBreakWeekdays] = useState<Weekday[]>([]);

  const selectedStaff = useMemo(
    () => staffMembers.find((staff) => staff.id === selectedStaffId) ?? null,
    [staffMembers, selectedStaffId],
  );

  const selectedDays = useMemo(
    () =>
      selectedStaff
        ? WEEKDAYS.map((weekday) => rotaDays.find((day) => day.staffId === selectedStaff.id && day.weekday === weekday) ?? emptyDay(selectedStaff.id, weekday))
        : [],
    [rotaDays, selectedStaff],
  );

  function toggleBreaks(weekday: Weekday): void {
    setExpandedBreakWeekdays((current) =>
      current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday],
    );
  }

  function isWeekdayAllowed(weekday: Weekday): boolean {
    if (!selectedStaff?.availableWeekdays || selectedStaff.availableWeekdays.length === 0) return true;
    return selectedStaff.availableWeekdays.includes(weekday);
  }

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
    const target = selectedDays.find((day) => day.weekday === weekday) ?? {
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
    setExpandedBreakWeekdays((current) => (current.includes(weekday) ? current : [...current, weekday]));
  }

  function updateBreak(staffId: string, weekday: Weekday, breakId: string, patch: Partial<StaffBreakWindow>) {
    const target = selectedDays.find((day) => day.weekday === weekday) ?? emptyDay(staffId, weekday);
    const nextBreaks = target.breaks.map((item) => (item.id === breakId ? { ...item, ...patch } : item));
    updateDay(staffId, weekday, { breaks: nextBreaks });
  }

  function removeBreak(staffId: string, weekday: Weekday, breakId: string) {
    if (!window.confirm("Remove this break window?")) return;
    const target = selectedDays.find((day) => day.weekday === weekday) ?? emptyDay(staffId, weekday);
    updateDay(staffId, weekday, { breaks: target.breaks.filter((item) => item.id !== breakId) });
  }

  function reload() {
    setRotaDays(listLocalStaffRota(industrySlug));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Staff rota & breaks</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${secondaryButtonClass} ${smallButtonClass}`} onClick={() => setRotaDays(seedLocalStaffRota(industrySlug, staffMembers))}>Seed</button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={reload}>Reload</button>
          <button
            type="button"
            className={`${dangerButtonClass} ${smallButtonClass}`}
            onClick={() => {
              if (!window.confirm("Clear local staff rota for this industry?")) return;
              clearLocalStaffRota(industrySlug);
              reload();
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {staffMembers.length === 0 ? (
        <p className="text-sm text-slate-600">No staff members yet. Add staff first.</p>
      ) : (
        <>
          <label className="mb-3 block text-xs font-medium text-slate-700">
            Staff member
            <select className="mt-1 w-full max-w-sm rounded-md border border-slate-300 px-2 py-2 text-sm" value={selectedStaffId} onChange={(event) => setSelectedStaffId(event.target.value)}>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.displayName}</option>
              ))}
            </select>
          </label>

          {selectedStaff ? (
            <div className="space-y-2">
              {selectedDays.map((day) => {
                const allowed = isWeekdayAllowed(day.weekday);
                const showBreaks = expandedBreakWeekdays.includes(day.weekday);
                return (
                  <div key={`${selectedStaff.id}_${day.weekday}`} className={`rounded-md border p-2 ${allowed ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_auto_auto_auto_auto] sm:items-center">
                      <p className="text-xs font-semibold text-slate-700">{weekdayLabel(day.weekday)}</p>
                      <label className="text-xs text-slate-700">
                        <input type="checkbox" className="mr-1" checked={day.working} disabled={!allowed} onChange={(event) => updateDay(selectedStaff.id, day.weekday, { working: event.target.checked, startTime: event.target.checked ? (day.startTime ?? "09:00") : undefined, endTime: event.target.checked ? (day.endTime ?? "17:00") : undefined })} />
                        Working
                      </label>
                      <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={day.startTime ?? ""} disabled={!day.working || !allowed} onChange={(event) => updateDay(selectedStaff.id, day.weekday, { startTime: event.target.value })} />
                      <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={day.endTime ?? ""} disabled={!day.working || !allowed} onChange={(event) => updateDay(selectedStaff.id, day.weekday, { endTime: event.target.value })} />
                      <button type="button" className="text-xs font-semibold text-sky-700" disabled={!day.working || !allowed} onClick={() => toggleBreaks(day.weekday)}>
                        {showBreaks ? "Hide breaks" : "Show breaks"}
                      </button>
                    </div>

                    {!allowed ? <p className="mt-1 text-xs text-amber-700">This staff member is not available for this day.</p> : null}

                    {showBreaks ? (
                      <div className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-700">Breaks</p>
                          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} disabled={!day.working || !allowed} onClick={() => addBreak(selectedStaff.id, day.weekday)}>
                            Add break
                          </button>
                        </div>
                        {day.breaks.length === 0 ? <p className="text-xs text-slate-500">No breaks set.</p> : null}
                        {day.breaks.map((item) => (
                          <div key={item.id} className="grid grid-cols-1 gap-1 rounded border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_auto_auto_auto]">
                            <input className="rounded border border-slate-300 px-2 py-1 text-xs" value={item.label ?? ""} placeholder="Label" onChange={(event) => updateBreak(selectedStaff.id, day.weekday, item.id, { label: event.target.value })} />
                            <input type="time" className="rounded border border-slate-300 px-2 py-1 text-xs" value={item.startTime} onChange={(event) => updateBreak(selectedStaff.id, day.weekday, item.id, { startTime: event.target.value })} />
                            <input type="time" className="rounded border border-slate-300 px-2 py-1 text-xs" value={item.endTime} onChange={(event) => updateBreak(selectedStaff.id, day.weekday, item.id, { endTime: event.target.value })} />
                            <button type="button" className="text-xs font-semibold text-rose-700" onClick={() => removeBreak(selectedStaff.id, day.weekday, item.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      <div className="mt-3">
        <button type="button" className={primaryButtonClass} onClick={() => setRotaDays(saveLocalStaffRota(industrySlug, rotaDays))}>
          Save rota
        </button>
      </div>
    </section>
  );
}
