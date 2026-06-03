"use client";

import { useMemo, useState } from "react";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type DemoAvailabilityPreviewProps = {
  templateSlug: string;
  serviceName: string;
  durationMinutes?: number;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDemoSlots(date: string): string[] {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return [];
  if (day === 6) return ["10:00", "11:15", "12:30"];
  return ["09:30", "10:15", "11:00", "13:30", "14:15", "15:00"];
}

export function DemoAvailabilityPreview({
  templateSlug,
  serviceName,
  durationMinutes,
}: DemoAvailabilityPreviewProps) {
  const [date, setDate] = useState(todayIso());
  const [staffMode, setStaffMode] = useState("any");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const slots = useMemo(() => buildDemoSlots(date), [date]);

  function confirmDemoBooking(slot: string) {
    setSelectedSlot(slot);
    setMessage(
      "Demo booking preview only. A real subscriber site records bookings against that business account.",
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Check availability</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">
          Date
          <input
            type="date"
            min={todayIso()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedSlot(null);
              setMessage(null);
            }}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Staff
          <select
            value={staffMode}
            onChange={(event) => setStaffMode(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
          >
            <option value="any">Any available staff</option>
            <option value="preferred">Preferred staff member</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {durationMinutes ? `${durationMinutes} minute appointment.` : "Duration is configured in the business admin."}
      </p>
      {slots.length > 0 ? (
        <>
          <p className="mt-3 text-sm font-semibold text-emerald-800">Available times found.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                className={`${selectedSlot === slot ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
                onClick={() => confirmDemoBooking(slot)}
              >
                {slot}
                {staffMode === "preferred" ? " with demo staff" : ""}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No available times found for this date. Please try another date.
        </p>
      )}
      {message ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          <p className="font-semibold">{serviceName} selected</p>
          <p className="mt-1">{message}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`/demo/${templateSlug}/account`} className={`${primaryButtonClass} ${smallButtonClass}`}>
              Demo account view
            </a>
            <a href={`/demo/${templateSlug}/admin`} className={`${outlineButtonClass} ${smallButtonClass}`}>
              Demo admin view
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
