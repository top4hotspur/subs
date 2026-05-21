"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  listLocalSetupRequests,
  seedLocalSetupRequests,
  updateLocalSetupRequestStatus,
} from "@/lib/setup/local-setup-requests";
import { LocalAnalyticsDashboard } from "@/components/analytics/local-analytics-dashboard";
import { isSlotBlockedByExistingRequest } from "@/lib/calendar/local-appointment-conflicts";
import {
  assignLocalCustomerRequestStaff,
  listLocalCustomerRequests,
  seedLocalCustomerRequests,
  updateLocalCustomerRequestStatus,
} from "@/lib/requests/local-customer-requests";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import {
  CustomerRequest,
  CustomerRequestStatus,
} from "@/lib/requests/request-types";
import {
  listLocalNotificationTemplates,
  renderNotificationPreview,
} from "@/lib/notifications/local-notification-templates";
import {
  NotificationChannel,
  NotificationEventType,
} from "@/lib/notifications/notification-types";
import { listLocalStaff } from "@/lib/staff/local-staff";
import { StaffMember } from "@/lib/staff/staff-types";
import {
  CommunicationOption,
  LocalSetupRequest,
  SubscriptionSetupStatus,
  WEBSITE_TEMPLATE_SLUGS,
  WebsiteTemplateSlug,
} from "@/lib/sites/types";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { SetupStatusBadge } from "@/components/setup/setup-status-badge";
import { RequestStatusBadge } from "@/components/requests/request-status-badge";
import { listLocalCustomers } from "@/lib/crm/local-customers";
import {
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import {
  communicationOptionLabel,
  customerRequestStatusDescription,
  domainOptionLabel,
  formatGbp,
  formatIsoDateTime,
  formatOptional,
  formatUkDate,
  notificationEventTypeLabel,
} from "@/lib/ui/display-labels";

type AdminFilter = "ALL" | "REVIEW" | "DOMAIN" | "PAYMENT" | "PROVISIONING" | "LIVE";

function toSlug(value: string): WebsiteTemplateSlug | null {
  return WEBSITE_TEMPLATE_SLUGS.includes(value as WebsiteTemplateSlug)
    ? (value as WebsiteTemplateSlug)
    : null;
}

function formatDateTime(date?: string, time?: string): string {
  if (!date && !time) return "TBC";
  if (date && time) return `${formatUkDate(date)} at ${time}`;
  return date ? formatUkDate(date) : time ?? "TBC";
}

function plusMinutes(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function AdminPage() {
  const [setupRequests, setSetupRequests] = useState<LocalSetupRequest[]>(() => listLocalSetupRequests());
  const [filter, setFilter] = useState<AdminFilter>("ALL");
  const [customerRequests, setCustomerRequests] = useState<CustomerRequest[]>(() => listLocalCustomerRequests());
  const [staffInputs, setStaffInputs] = useState<Record<string, string>>({});
  const [analyticsIndustryFilter, setAnalyticsIndustryFilter] = useState<"ALL" | WebsiteTemplateSlug>("ALL");

  function refreshSetup(): void {
    setSetupRequests(listLocalSetupRequests());
  }

  function refreshCustomer(): void {
    setCustomerRequests(listLocalCustomerRequests());
  }

  function setSetupStatus(id: string, status: SubscriptionSetupStatus): void {
    updateLocalSetupRequestStatus(id, status);
    refreshSetup();
  }

  function setCustomerStatus(id: string, status: CustomerRequestStatus): void {
    updateLocalCustomerRequestStatus(id, status);
    refreshCustomer();
  }

  const staffByIndustry = useMemo<Record<WebsiteTemplateSlug, StaffMember[]>>(() => {
    const entries = WEBSITE_TEMPLATE_SLUGS.map((slug) => [slug, listLocalStaff(slug)] as const);
    return Object.fromEntries(entries) as Record<WebsiteTemplateSlug, StaffMember[]>;
  }, []);

  const counts = {
    total: setupRequests.length,
    review: setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED).length,
    domain: setupRequests.filter((r) => r.status === SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED).length,
    payment: setupRequests.filter((r) => r.status === SubscriptionSetupStatus.PAYMENT_PENDING).length,
    provisioning: setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SITE_PROVISIONING).length,
    live: setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE).length,
  };

  const filteredRequests = useMemo(() => {
    switch (filter) {
      case "REVIEW":
        return setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED);
      case "DOMAIN":
        return setupRequests.filter((r) => r.status === SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED);
      case "PAYMENT":
        return setupRequests.filter((r) => r.status === SubscriptionSetupStatus.PAYMENT_PENDING);
      case "PROVISIONING":
        return setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SITE_PROVISIONING);
      case "LIVE":
        return setupRequests.filter((r) => r.status === SubscriptionSetupStatus.SITE_LIVE);
      case "ALL":
      default:
        return setupRequests;
    }
  }, [setupRequests, filter]);

  const analyticsRequests = useMemo(
    () =>
      analyticsIndustryFilter === "ALL"
        ? customerRequests
        : customerRequests.filter((request) => request.templateSlug === analyticsIndustryFilter),
    [customerRequests, analyticsIndustryFilter],
  );

  const analyticsSetupRequests = useMemo(
    () =>
      analyticsIndustryFilter === "ALL"
        ? setupRequests
        : setupRequests.filter((request) => request.templateSlug === analyticsIndustryFilter),
    [setupRequests, analyticsIndustryFilter],
  );

  const analyticsStaff = useMemo(() => {
    if (analyticsIndustryFilter === "ALL") {
      return WEBSITE_TEMPLATE_SLUGS.flatMap((slug) => staffByIndustry[slug] ?? []);
    }
    return staffByIndustry[analyticsIndustryFilter] ?? [];
  }, [analyticsIndustryFilter, staffByIndustry]);

  const analyticsServices = useMemo(() => {
    const slugs = analyticsIndustryFilter === "ALL" ? WEBSITE_TEMPLATE_SLUGS : [analyticsIndustryFilter];
    const allServices = slugs.flatMap((slug) => {
      const template = getWebsiteTemplate(slug);
      if (!template) return [];
      return getLocalCustomerSiteSettings(slug, template).services.filter((service) => service.active);
    });
    const deduped = new Map(allServices.map((service) => [`${service.id}:${service.name}`, service]));
    return Array.from(deduped.values());
  }, [analyticsIndustryFilter]);

  const crmCustomerCount = listLocalCustomers().length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Mock Admin Portal</h1>
      <p className="mt-3 text-slate-600">Local-only queue preview. Auth/backends are not implemented yet.</p>
      <div className="mt-3">
        <Link href="/admin/settings" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          Open mock settings editor
        </Link>
      </div>
      <div className="mt-2">
        <Link href="/admin/crm" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          Open mock CRM
        </Link>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Future site settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          In the live admin portal, business owners/admins will manage branding, business details, service areas,
          page/section visibility, About/Terms/Privacy/Cookie content, services and pricing, notification settings,
          analytics, and later financial/income settings.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Customer CRM</h2>
        <p className="mt-2 text-sm text-slate-600">
          Local CRM records are now in a dedicated page to keep this dashboard focused on queues and analytics.
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Current local customers: <span className="font-semibold">{crmCustomerCount}</span>
        </p>
        <div className="mt-3">
          <Link href="/admin/crm" className={`${primaryButtonClass} ${smallButtonClass}`}>
            Open CRM
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Total</p><p className="text-xl font-semibold">{counts.total}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Review requested</p><p className="text-xl font-semibold">{counts.review}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Domain required</p><p className="text-xl font-semibold">{counts.domain}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Payment pending</p><p className="text-xl font-semibold">{counts.payment}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Provisioning</p><p className="text-xl font-semibold">{counts.provisioning}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-600">Live</p><p className="text-xl font-semibold">{counts.live}</p></article>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["ALL", "All"],
          ["REVIEW", "Review requested"],
          ["DOMAIN", "Domain details required"],
          ["PAYMENT", "Payment pending"],
          ["PROVISIONING", "Provisioning"],
          ["LIVE", "Live"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${filter === value ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
            onClick={() => setFilter(value as AdminFilter)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className={`${secondaryButtonClass} ${smallButtonClass}`}
          onClick={() => {
            seedLocalSetupRequests();
            refreshSetup();
          }}
        >
          Load sample setup requests
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {filteredRequests.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">No setup requests match this filter.</p>
          </article>
        ) : (
          filteredRequests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{request.businessName}</h2>
                <SetupStatusBadge status={request.status} />
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
                <p><span className="font-semibold">Contact:</span> {formatOptional(request.contactName)}</p>
                <p><span className="font-semibold">Contact email:</span> {formatOptional(request.contactEmail)}</p>
                <p><span className="font-semibold">Contact phone:</span> {formatOptional(request.contactPhone)}</p>
                <p><span className="font-semibold">Domain choice:</span> {domainOptionLabel(request.domainOption)}</p>
                <p><span className="font-semibold">Domain value:</span> {formatOptional(request.existingDomain || request.desiredDomain)}</p>
                <p><span className="font-semibold">Communication:</span> {communicationOptionLabel(request.communicationOption)}</p>
                <p><span className="font-semibold">WhatsApp add-on:</span> {request.communicationOption === CommunicationOption.EMAIL_AND_WHATSAPP ? "Yes" : "No"}</p>
                <p><span className="font-semibold">Setup total:</span> {formatGbp(request.setupTotalGbp)}</p>
                <p><span className="font-semibold">Monthly total:</span> {formatGbp(request.monthlyTotalGbp)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSetupStatus(request.id, SubscriptionSetupStatus.DOMAIN_DETAILS_REQUIRED)}>
                  Domain details required
                </button>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSetupStatus(request.id, SubscriptionSetupStatus.PAYMENT_PENDING)}>
                  Payment pending
                </button>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSetupStatus(request.id, SubscriptionSetupStatus.SITE_PROVISIONING)}>
                  Provisioning
                </button>
                <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => setSetupStatus(request.id, SubscriptionSetupStatus.SITE_LIVE)}>
                  Live
                </button>
                <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => setSetupStatus(request.id, SubscriptionSetupStatus.CANCELLED)}>
                  Cancelled
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Local analytics & income preview</h2>
          <label className="text-sm font-medium text-slate-700">
            Industry
            <select
              className="ml-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={analyticsIndustryFilter}
              onChange={(event) =>
                setAnalyticsIndustryFilter(
                  event.target.value === "ALL" ? "ALL" : (event.target.value as WebsiteTemplateSlug),
                )
              }
            >
              <option value="ALL">All industries</option>
              {WEBSITE_TEMPLATE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {slug}
                </option>
              ))}
            </select>
          </label>
        </div>
        <LocalAnalyticsDashboard
          industrySlug={analyticsIndustryFilter === "ALL" ? undefined : analyticsIndustryFilter}
          requests={analyticsRequests}
          setupRequests={analyticsSetupRequests}
          services={analyticsServices}
          staffMembers={analyticsStaff}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Mock customer requests/jobs</h2>
          <button
            type="button"
            className={`${secondaryButtonClass} ${smallButtonClass}`}
            onClick={() => {
              seedLocalCustomerRequests();
              refreshCustomer();
            }}
          >
            Load sample customer requests
          </button>
        </div>

        {customerRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No local customer requests yet. Submit one from a demo page.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {customerRequests.map((request) => {
              const requestSlug = toSlug(request.templateSlug);
              const industryStaff = requestSlug ? staffByIndustry[requestSlug] ?? [] : [];
              const activeStaff = industryStaff.filter((member) => member.active);
              const selectableStaff = activeStaff.filter((member) => member.customerSelectable || member.active);

              const notificationTemplates = requestSlug
                ? listLocalNotificationTemplates(requestSlug, "MyExperiment.club")
                : [];
              const completedTemplate = notificationTemplates.find(
                (template) =>
                  template.eventType === NotificationEventType.JOB_COMPLETED &&
                  template.channel === NotificationChannel.EMAIL,
              );
              const reviewTemplate = notificationTemplates.find(
                (template) =>
                  template.eventType === NotificationEventType.REVIEW_REQUEST &&
                  template.channel === NotificationChannel.EMAIL,
              );
              const assignmentConflict =
                request.assignedStaffId && request.preferredDate && request.preferredTime && requestSlug
                  ? isSlotBlockedByExistingRequest({
                      industrySlug: requestSlug,
                      staffId: request.assignedStaffId,
                      date: request.preferredDate,
                      startTime: request.preferredTime,
                      endTime: plusMinutes(request.preferredTime, request.estimatedDurationMinutes ?? 45),
                      existingRequests: customerRequests,
                      excludeRequestId: request.id,
                    })
                  : { blocked: false as const };

              return (
                <article key={request.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{request.serviceName || request.kind}</p>
                    <RequestStatusBadge status={request.status} compact />
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p><span className="font-semibold">Industry:</span> {request.templateSlug}</p>
                    <p><span className="font-semibold">Customer:</span> {request.customerName}</p>
                    <p><span className="font-semibold">Email:</span> {request.customerEmail}</p>
                    <p><span className="font-semibold">Phone:</span> {request.customerPhone}</p>
                    <p><span className="font-semibold">Preferred date/time:</span> {formatDateTime(request.preferredDate, request.preferredTime)}</p>
                    <p><span className="font-semibold">Preferred staff:</span> {formatOptional(request.preferredStaffName)}</p>
                    <p><span className="font-semibold">Assigned staff:</span> {request.assignedStaffName || "Unassigned"}</p>
                    {request.assignedStaffName ? (
                      <p><span className="font-semibold">Schedule note:</span> {request.assignedStaffName} is currently assigned.</p>
                    ) : null}
                  </div>
                  {requestSlug && isAppointmentStyleIndustry(requestSlug) ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {requestSlug === "beauticians"
                          ? "Treatment workflow view"
                          : requestSlug === "massage"
                            ? "Massage session workflow view"
                            : requestSlug === "dog-grooming"
                              ? "Grooming appointment workflow view"
                              : "Appointment workflow view"}
                      </p>
                      <p className="mt-1">
                        Service: {request.serviceName || "TBC"} | Date: {request.preferredDate || "TBC"} | Time: {request.preferredTime || "TBC"}
                      </p>
                      <p className="mt-1">
                        Preferred staff: {formatOptional(request.preferredStaffName, "No preference")} | Assigned: {formatOptional(request.assignedStaffName, "Unassigned")}
                      </p>
                      {requestSlug === "dog-grooming" && request.extraDetails ? (
                        <p className="mt-1">
                          Pet: {formatOptional(request.extraDetails.petName, "N/A")} | Breed: {formatOptional(request.extraDetails.breed, "N/A")} | Size: {formatOptional(request.extraDetails.dogSize, "N/A")}
                          {request.extraDetails.temperamentNotes ? ` | Notes: ${request.extraDetails.temperamentNotes}` : ""}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-600">{customerRequestStatusDescription(request.status)}</p>
                  {assignmentConflict.blocked ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Warning: assigned staff appears to have another local request at this time.
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    {selectableStaff.length > 0 ? (
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={staffInputs[request.id] ?? request.assignedStaffId ?? ""}
                        onChange={(event) => setStaffInputs((c) => ({ ...c, [request.id]: event.target.value }))}
                      >
                        <option value="">Select staff member</option>
                        {selectableStaff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        placeholder="Assign staff name"
                        value={staffInputs[request.id] ?? request.assignedStaffName ?? ""}
                        onChange={(event) => setStaffInputs((c) => ({ ...c, [request.id]: event.target.value }))}
                      />
                    )}
                    <button
                      type="button"
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => {
                        const value = staffInputs[request.id] ?? "";
                        if (selectableStaff.length > 0) {
                          const selected = selectableStaff.find((member) => member.id === value);
                          assignLocalCustomerRequestStaff(request.id, {
                            staffId: selected?.id,
                            staffName: selected?.displayName,
                          });
                        } else {
                          assignLocalCustomerRequestStaff(request.id, { staffName: value });
                        }
                        refreshCustomer();
                      }}
                    >
                      Save staff
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.REVIEWING)}>Reviewing</button>
                    <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.QUOTED)}>Quoted</button>
                    <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.CONFIRMED)}>Confirmed</button>
                    <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.STAFF_ALLOCATED)}>Staff allocated</button>
                    <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.COMPLETED)}>Completed</button>
                    <button type="button" className={`${dangerButtonClass} ${smallButtonClass}`} onClick={() => setCustomerStatus(request.id, CustomerRequestStatus.CANCELLED)}>Cancelled</button>
                  </div>

                  {request.status === CustomerRequestStatus.COMPLETED ? (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      <p>
                        In the live version, this would send completion confirmation and review request messages
                        (email by default, WhatsApp if enabled).
                        {request.completionMessageSentAtIso ? ` Completion marked: ${formatIsoDateTime(request.completionMessageSentAtIso)}.` : ""}
                        {request.reviewRequestSentAtIso ? ` Review request marked: ${formatIsoDateTime(request.reviewRequestSentAtIso)}.` : ""}
                      </p>
                      <p className="mt-2 font-semibold">
                        Templates applied: {notificationEventTypeLabel(NotificationEventType.JOB_COMPLETED)} + {notificationEventTypeLabel(NotificationEventType.REVIEW_REQUEST)}
                      </p>
                      {completedTemplate ? (
                        <p className="mt-1">Completion preview: {renderNotificationPreview(completedTemplate, {
                          businessName: "MyExperiment.club",
                          customerName: request.customerName,
                          serviceName: request.serviceName,
                          bookingDate: request.preferredDate,
                          bookingTime: request.preferredTime,
                          staffName: request.assignedStaffName,
                          websiteUrl: "https://www.myexperiment.club",
                          reviewUrl: "https://www.myexperiment.club/review",
                          nextBookingDate: "2026-06-15",
                        }).slice(0, 180)}...</p>
                      ) : null}
                      {reviewTemplate ? (
                        <p className="mt-1">Review preview: {renderNotificationPreview(reviewTemplate, {
                          businessName: "MyExperiment.club",
                          customerName: request.customerName,
                          serviceName: request.serviceName,
                          bookingDate: request.preferredDate,
                          bookingTime: request.preferredTime,
                          staffName: request.assignedStaffName,
                          websiteUrl: "https://www.myexperiment.club",
                          reviewUrl: "https://www.myexperiment.club/review",
                          nextBookingDate: "2026-06-15",
                        }).slice(0, 180)}...</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

