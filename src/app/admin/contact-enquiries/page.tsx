"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatIsoDateTime } from "@/lib/ui/display-labels";

type ContactEnquiryStatus = "NEW" | "REVIEWED" | "REPLIED" | "CLOSED";

type ContactEnquiry = {
  id: string;
  name: string;
  businessName?: string | null;
  email: string;
  phone?: string | null;
  industrySlug?: string | null;
  message: string;
  source?: string | null;
  status: ContactEnquiryStatus;
  createdAt: string;
};

const STATUS_OPTIONS: ContactEnquiryStatus[] = ["NEW", "REVIEWED", "REPLIED", "CLOSED"];

export default function AdminContactEnquiriesPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContactEnquiryStatus>("NEW");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string>("");
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);

  async function loadEnquiries(filter: "ALL" | ContactEnquiryStatus) {
    setLoading(true);
    setErrorText("");
    const query =
      filter === "ALL" ? "" : `?status=${encodeURIComponent(filter)}`;
    try {
      const response = await fetch(`/api/admin/contact-enquiries${query}`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; enquiries?: ContactEnquiry[]; error?: string }
        | null;
      if (!response.ok || !payload?.ok || !payload.enquiries) {
        setErrorText(payload?.error || "Could not load contact enquiries.");
        setLoading(false);
        return;
      }
      setEnquiries(payload.enquiries);
    } catch {
      setErrorText("Could not load contact enquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEnquiries(statusFilter);
  }, [statusFilter]);

  const statusCounts = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<ContactEnquiryStatus, number>>((acc, status) => {
      acc[status] = enquiries.filter((item) => item.status === status).length;
      return acc;
    }, { NEW: 0, REVIEWED: 0, REPLIED: 0, CLOSED: 0 });
  }, [enquiries]);

  async function setStatus(id: string, status: ContactEnquiryStatus) {
    try {
      const response = await fetch(`/api/admin/contact-enquiries/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        setErrorText(payload?.error || "Could not update enquiry status.");
        return;
      }
      await loadEnquiries(statusFilter);
    } catch {
      setErrorText("Could not update enquiry status.");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Contact enquiries</h1>
      <p className="mt-2 text-slate-600">
        Prospect and setup-support enquiries submitted from the public contact route.
      </p>
      <AdminPillNav />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-600">New</p>
          <p className="text-xl font-semibold text-slate-900">{statusCounts.NEW}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-600">Reviewed</p>
          <p className="text-xl font-semibold text-slate-900">{statusCounts.REVIEWED}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-600">Replied</p>
          <p className="text-xl font-semibold text-slate-900">{statusCounts.REPLIED}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-600">Closed</p>
          <p className="text-xl font-semibold text-slate-900">{statusCounts.CLOSED}</p>
        </article>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${statusFilter === "ALL" ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
          onClick={() => setStatusFilter("ALL")}
        >
          All
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`${statusFilter === status ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {errorText ? (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorText}
        </p>
      ) : null}

      <section className="mt-6 space-y-4">
        {loading ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">Loading enquiries...</p>
          </article>
        ) : enquiries.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-700">No enquiries found for this filter.</p>
          </article>
        ) : (
          enquiries.map((enquiry) => (
            <article key={enquiry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{enquiry.name}</h2>
                <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {enquiry.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Business:</span> {enquiry.businessName || "-"}</p>
                <p><span className="font-semibold">Email:</span> {enquiry.email}</p>
                <p><span className="font-semibold">Phone:</span> {enquiry.phone || "-"}</p>
                <p><span className="font-semibold">Industry:</span> {enquiry.industrySlug || "-"}</p>
                <p><span className="font-semibold">Source:</span> {enquiry.source || "contact-page"}</p>
                <p><span className="font-semibold">Received:</span> {formatIsoDateTime(enquiry.createdAt)}</p>
              </div>
              <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {enquiry.message}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`${status === enquiry.status ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`}
                    onClick={() => void setStatus(enquiry.id, status)}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
