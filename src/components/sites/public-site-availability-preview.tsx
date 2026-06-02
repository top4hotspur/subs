"use client";

import { useMemo, useState } from "react";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type PublicAvailabilityStaff = {
  id: string;
  displayName: string;
  customerSelectable: boolean;
};

type PublicAvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
  staffMemberId: string;
  staffName: string;
  serviceId: string;
};

type AvailabilityResponse = {
  ok?: boolean;
  serviceId?: string;
  staffId?: string | null;
  anyStaff?: boolean;
  date?: string;
  slots?: PublicAvailabilitySlot[];
  message?: string;
  error?: string;
};

type PublicSiteAvailabilityPreviewProps = {
  siteSlug: string;
  serviceId: string;
  serviceName: string;
  staff: PublicAvailabilityStaff[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PublicSiteAvailabilityPreview({
  siteSlug,
  serviceId,
  serviceName,
  staff,
}: PublicSiteAvailabilityPreviewProps) {
  const selectableStaff = useMemo(() => staff.filter((member) => member.customerSelectable), [staff]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);

  async function checkAvailability() {
    setLoading(true);
    setSelectedSlot(null);
    setMessage("Checking availability...");
    try {
      const params = new URLSearchParams({ serviceId, date });
      if (staffId) params.set("staffId", staffId);
      const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/availability?${params.toString()}`);
      const body = (await response.json()) as AvailabilityResponse;
      if (!response.ok || !body.ok) {
        setSlots([]);
        setMessage(body.error ?? "Could not check availability right now.");
        return;
      }
      setSlots(body.slots ?? []);
      setMessage(body.message ?? ((body.slots?.length ?? 0) > 0 ? "Available times found." : "No available times found for this date. Please try another date."));
    } catch {
      setSlots([]);
      setMessage("Could not check availability right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        className={`${primaryButtonClass} ${smallButtonClass}`}
        onClick={() => {
          setOpen((current) => !current);
          if (!open && slots.length === 0 && !message) void checkAvailability();
        }}
      >
        {open ? "Hide available times" : "Check availability"}
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            {selectableStaff.length > 0 ? (
              <label className="text-xs font-semibold text-slate-700">
                Staff member
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={staffId}
                  onChange={(event) => setStaffId(event.target.value)}
                >
                  <option value="">Any available staff</option>
                  {selectableStaff.map((member) => (
                    <option key={member.id} value={member.id}>{member.displayName}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void checkAvailability()} disabled={loading}>
            {loading ? "Checking..." : `View times for ${serviceName}`}
          </button>
          {message ? <p className="text-xs text-slate-600">{message}</p> : null}
          {slots.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.slice(0, 24).map((slot) => (
                <button
                  key={`${slot.staffMemberId}-${slot.startTime}`}
                  type="button"
                  className="rounded-md border border-teal-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-800 hover:border-teal-400 hover:bg-teal-50"
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="block">{slot.startTime}-{slot.endTime}</span>
                  <span className="block font-normal text-slate-500">{slot.staffName}</span>
                </button>
              ))}
            </div>
          ) : null}
          {selectedSlot ? (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-950">
              <span className="font-semibold">Next step:</span> customer details and confirmation. Booking request flow coming soon.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
