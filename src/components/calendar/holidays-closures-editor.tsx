"use client";

import { useMemo, useState } from "react";
import { BusinessClosureDate, StaffHolidayDate } from "@/lib/calendar/closure-types";
import {
  clearLocalClosures,
  listLocalBusinessClosures,
  listLocalStaffHolidays,
  saveLocalBusinessClosures,
  saveLocalStaffHolidays,
  seedLocalClosures,
} from "@/lib/calendar/local-closures";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import { dangerButtonClass, outlineButtonClass, primaryButtonClass, secondaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatUkDate } from "@/lib/ui/display-labels";

type Props = {
  industrySlug: WebsiteTemplateSlug;
  staffMembers: StaffMember[];
};

function id(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function HolidaysClosuresEditor({ industrySlug, staffMembers }: Props) {
  const [businessClosures, setBusinessClosures] = useState<BusinessClosureDate[]>(() => listLocalBusinessClosures(industrySlug));
  const [staffHolidays, setStaffHolidays] = useState<StaffHolidayDate[]>(() => listLocalStaffHolidays(industrySlug));

  const staffMap = useMemo(() => new Map(staffMembers.map((s) => [s.id, s.displayName])), [staffMembers]);

  function reload() {
    setBusinessClosures(listLocalBusinessClosures(industrySlug));
    setStaffHolidays(listLocalStaffHolidays(industrySlug));
  }

  function addBusinessClosure() {
    const now = new Date().toISOString();
    const next = [...businessClosures, {
      id: id("biz_closure"),
      industrySlug,
      date: "",
      label: "Closure",
      allDay: true,
      active: true,
      createdAtIso: now,
      updatedAtIso: now,
    }];
    setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
  }

  function addStaffHoliday() {
    if (staffMembers.length === 0) return;
    const now = new Date().toISOString();
    const next = [...staffHolidays, {
      id: id("staff_holiday"),
      staffId: staffMembers[0].id,
      date: "",
      label: "Holiday",
      allDay: true,
      active: true,
      createdAtIso: now,
      updatedAtIso: now,
    }];
    setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Holidays and Closures</h2>
          <p className="text-xs text-slate-600">Local/mock only. Use these dates to model closed days and staff leave.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${secondaryButtonClass} ${smallButtonClass}`} onClick={() => {
            const seeded = seedLocalClosures(industrySlug);
            setBusinessClosures(seeded.businessClosures);
            setStaffHolidays(seeded.staffHolidays);
          }}>Seed defaults</button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={reload}>Reload</button>
          <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => {
            if (!window.confirm("Clear local closures and holidays?")) return;
            clearLocalClosures(industrySlug);
            reload();
          }}>Clear</button>
        </div>
      </div>

      <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Business closures</h3>
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={addBusinessClosure}>Add closure</button>
        </div>
        {businessClosures.length === 0 ? <p className="text-xs text-slate-600">No closures set.</p> : businessClosures.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-6">
            <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={item.date} onChange={(e) => {
              const next = businessClosures.map((c) => c.id === item.id ? { ...c, date: e.target.value, updatedAtIso: new Date().toISOString() } : c);
              setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
            }} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" value={item.label} onChange={(e) => {
              const next = businessClosures.map((c) => c.id === item.id ? { ...c, label: e.target.value, updatedAtIso: new Date().toISOString() } : c);
              setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
            }} />
            <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={item.allDay} onChange={(e) => {
              const next = businessClosures.map((c) => c.id === item.id ? { ...c, allDay: e.target.checked, updatedAtIso: new Date().toISOString() } : c);
              setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
            }} />All day</label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={item.active} onChange={(e) => {
              const next = businessClosures.map((c) => c.id === item.id ? { ...c, active: e.target.checked, updatedAtIso: new Date().toISOString() } : c);
              setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
            }} />Active</label>
            <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => {
              if (!window.confirm("Remove closure?")) return;
              const next = businessClosures.filter((c) => c.id !== item.id);
              setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
            }}>Remove</button>
            {!item.allDay ? (
              <>
                <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={item.startTime ?? ""} onChange={(e) => {
                  const next = businessClosures.map((c) => c.id === item.id ? { ...c, startTime: e.target.value, updatedAtIso: new Date().toISOString() } : c);
                  setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
                }} />
                <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={item.endTime ?? ""} onChange={(e) => {
                  const next = businessClosures.map((c) => c.id === item.id ? { ...c, endTime: e.target.value, updatedAtIso: new Date().toISOString() } : c);
                  setBusinessClosures(saveLocalBusinessClosures(industrySlug, next));
                }} />
              </>
            ) : null}
            {item.date ? <p className="text-xs text-slate-500 sm:col-span-6">Display: {formatUkDate(item.date)}</p> : null}
          </div>
        ))}
      </article>

      <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Staff holidays</h3>
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={addStaffHoliday}>Add staff holiday</button>
        </div>
        {staffHolidays.length === 0 ? <p className="text-xs text-slate-600">No staff holidays set.</p> : staffHolidays.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-6">
            <select className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={item.staffId} onChange={(e) => {
              const next = staffHolidays.map((h) => h.id === item.id ? { ...h, staffId: e.target.value, updatedAtIso: new Date().toISOString() } : h);
              setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
            }}>
              {staffMembers.map((staff) => <option key={staff.id} value={staff.id}>{staff.displayName}</option>)}
            </select>
            <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={item.date} onChange={(e) => {
              const next = staffHolidays.map((h) => h.id === item.id ? { ...h, date: e.target.value, updatedAtIso: new Date().toISOString() } : h);
              setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
            }} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-xs sm:col-span-2" value={item.label} onChange={(e) => {
              const next = staffHolidays.map((h) => h.id === item.id ? { ...h, label: e.target.value, updatedAtIso: new Date().toISOString() } : h);
              setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
            }} />
            <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={item.allDay} onChange={(e) => {
              const next = staffHolidays.map((h) => h.id === item.id ? { ...h, allDay: e.target.checked, updatedAtIso: new Date().toISOString() } : h);
              setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
            }} />All day</label>
            <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => {
              if (!window.confirm("Remove staff holiday?")) return;
              const next = staffHolidays.filter((h) => h.id !== item.id);
              setStaffHolidays(saveLocalStaffHolidays(industrySlug, next));
            }}>Remove</button>
            {item.date ? <p className="text-xs text-slate-500 sm:col-span-6">{staffMap.get(item.staffId) ?? "Staff"}: {formatUkDate(item.date)}</p> : null}
          </div>
        ))}
      </article>
    </section>
  );
}
