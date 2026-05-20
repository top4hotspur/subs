"use client";

import { useMemo } from "react";
import {
  getDefaultSchedulingNoteForIndustry,
  shouldUseFixedSlotsByDefault,
  shouldUseFlexibleWindowsByDefault,
} from "@/lib/calendar/industry-calendar-defaults";
import {
  listLocalBusinessAvailability,
  listLocalStaffAvailability,
} from "@/lib/calendar/local-availability";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  availabilityWindowTypeLabel,
  customerRequestKindLabel,
  formatOptional,
  weekdayLabel,
} from "@/lib/ui/display-labels";

type CalendarPreviewProps = {
  industrySlug: WebsiteTemplateSlug;
  staffMembers: StaffMember[];
  services: SiteServiceItem[];
};

function schedulingStyleLabel(slug: WebsiteTemplateSlug): string {
  if (slug === "taxi") return "Route-based journey allocation";
  if (shouldUseFlexibleWindowsByDefault(slug)) return "Flexible visit windows";
  if (shouldUseFixedSlotsByDefault(slug)) return "Fixed appointment slots";
  return "General scheduling";
}

export function CalendarPreview({ industrySlug, staffMembers, services }: CalendarPreviewProps) {
  const businessWindows = useMemo(
    () => listLocalBusinessAvailability(industrySlug).filter((window) => window.active),
    [industrySlug],
  );
  const staffWindows = useMemo(
    () => listLocalStaffAvailability(industrySlug).filter((window) => window.active),
    [industrySlug],
  );

  const requestItems = useMemo(
    () =>
      listLocalCustomerRequests()
        .filter((request) => request.templateSlug === industrySlug)
        .slice(0, 4),
    [industrySlug],
  );

  const activeServices = services.filter((service) => service.active);
  const activeStaff = staffMembers.filter((staff) => staff.active);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Calendar preview (mock)</h3>
      <p className="mt-1 text-xs text-slate-600">{schedulingStyleLabel(industrySlug)}. {getDefaultSchedulingNoteForIndustry(industrySlug)}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Business windows</h4>
          {businessWindows.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active business windows yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {businessWindows.slice(0, 6).map((window) => (
                <li key={window.id}>
                  {weekdayLabel(window.weekday)}: {window.startTime}-{window.endTime} ({availabilityWindowTypeLabel(window.type)})
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Staff coverage</h4>
          {activeStaff.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active staff configured.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {activeStaff.map((staff) => {
                const count = staffWindows.filter((window) => window.staffId === staff.id).length;
                return <li key={staff.id}>{staff.displayName}: {count} active windows</li>;
              })}
            </ul>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">Service durations</h4>
          {activeServices.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600">No active services configured.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {activeServices.slice(0, 6).map((service) => (
                <li key={service.id}>
                  {service.name}: {service.durationMinutes ? `${service.durationMinutes} min` : "duration TBC"}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <article className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-sm font-semibold text-slate-900">Example upcoming items</h4>
        {requestItems.length === 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>Mon 09:30 - Example request intake</li>
            <li>Tue 11:00 - Staff allocation review</li>
            <li>Wed 14:00 - Customer confirmation follow-up</li>
          </ul>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {requestItems.map((item) => (
              <li key={item.id}>
                {item.preferredDate || "Date TBC"} {item.preferredTime || "Time TBC"} - {item.customerName} ({formatOptional(item.serviceName, customerRequestKindLabel(item.kind))})
                {item.assignedStaffName ? ` with ${item.assignedStaffName}` : ""}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}


