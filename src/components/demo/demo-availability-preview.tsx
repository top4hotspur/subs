"use client";

import { useMemo, useState } from "react";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type DemoAvailabilityPreviewProps = {
  templateSlug: string;
  serviceName: string;
  durationMinutes?: number;
  initialOpen?: boolean;
};

type SlotGroupName = "Morning" | "Afternoon" | "Evening";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDemoSlots(date: string): string[] {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return [];
  if (day === 6) return ["10:00", "10:45", "11:30", "12:15", "13:30", "14:15"];
  return ["09:00", "09:30", "10:00", "10:45", "11:15", "13:00", "13:30", "14:15", "15:00", "16:15", "17:30"];
}

function slotGroupName(slot: string): SlotGroupName {
  const hour = Number(slot.slice(0, 2));
  if (Number.isFinite(hour) && hour < 12) return "Morning";
  if (Number.isFinite(hour) && hour < 17) return "Afternoon";
  return "Evening";
}

function addMinutes(time: string, minutes: number): string {
  const [hourRaw, minuteRaw] = time.split(":");
  const date = new Date(2000, 0, 1, Number(hourRaw), Number(minuteRaw));
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function DemoAvailabilityPreview({
  templateSlug,
  serviceName,
  durationMinutes,
  initialOpen = false,
}: DemoAvailabilityPreviewProps) {
  const [open, setOpen] = useState(initialOpen);
  const [date, setDate] = useState(todayIso());
  const [staffMode, setStaffMode] = useState<"any" | "preferred">("any");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const slots = useMemo(() => buildDemoSlots(date), [date]);
  const slotGroups = useMemo(() => {
    const groups: Record<SlotGroupName, string[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    slots.forEach((slot) => groups[slotGroupName(slot)].push(slot));
    return groups;
  }, [slots]);

  function selectDemoSlot(slot: string) {
    setSelectedSlot(slot);
    setMessage(null);
  }

  function submitDemoBooking() {
    if (!selectedSlot) {
      setMessage("Choose an available demo time first.");
      return;
    }
    if (!policyAccepted) {
      setMessage("Please confirm that you have read and accepted the booking and cancellation policy.");
      return;
    }
    setMessage("Demo only - no booking has been created.");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerNotes("");
    setPolicyAccepted(false);
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        className={`${primaryButtonClass} ${smallButtonClass}`}
        onClick={() => setOpen((current) => !current)}
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
              Staff member
              <select
                value={staffMode}
                onChange={(event) => {
                  setStaffMode(event.target.value as "any" | "preferred");
                  setSelectedSlot(null);
                }}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
              >
                <option value="any">Any available staff</option>
                <option value="preferred">Preferred demo stylist</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-600">
            {durationMinutes ? `${durationMinutes} minute appointment.` : "Duration is configured in the business admin."}
          </p>
          {slots.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-emerald-800">Available times found.</p>
              <div className="space-y-3">
                {(["Morning", "Afternoon", "Evening"] as SlotGroupName[]).map((groupName) => {
                  const groupSlots = slotGroups[groupName];
                  if (groupSlots.length === 0) return null;
                  return (
                    <div key={groupName} className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800">{groupName}</p>
                        <p className="text-[11px] text-slate-500">{groupSlots.length} time{groupSlots.length === 1 ? "" : "s"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groupSlots.map((slot) => {
                          const selected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              aria-pressed={selected}
                              className={
                                selected
                                  ? "rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm ring-2 ring-emerald-200"
                                  : "rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-teal-400 hover:bg-teal-50"
                              }
                              onClick={() => selectDemoSlot(slot)}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-slate-700">
              No available times found for this date. Please try another date.
            </p>
          )}

          {selectedSlot ? (
            <div className="rounded-lg border border-teal-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">
                Confirm {selectedSlot}-{addMinutes(selectedSlot, durationMinutes ?? 30)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Complete your details to preview the live booking confirmation flow.
              </p>
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                Demo payment wording mirrors a live site. No payment is taken and no booking is created from this demo.
              </p>
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
                <p className="font-semibold">Selected: {selectedSlot}-{addMinutes(selectedSlot, durationMinutes ?? 30)}</p>
                <p>{staffMode === "preferred" ? "Staff: Demo stylist" : "Staff will be assigned automatically."}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Your name
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Email
                  <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Phone
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Notes (optional)
                  <textarea className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Please read the booking and cancellation policy before submitting your booking.
              </p>
              <label className="mt-2 flex items-start gap-2 text-xs text-slate-700">
                <input type="checkbox" className="mt-0.5" checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} />
                <span>
                  I have read and accept the{" "}
                  <a href={`/demo/${templateSlug}/policy`} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 underline">
                    booking and cancellation policy
                  </a>.
                </span>
              </label>
              <button type="button" className={`mt-3 ${primaryButtonClass} ${smallButtonClass}`} onClick={submitDemoBooking}>
                Confirm demo booking
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
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
