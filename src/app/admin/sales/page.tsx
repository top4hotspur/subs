"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import {
  createBackendSalesLead,
  getBackendSalesLead,
  listBackendSalesLeads,
  markBackendSalesLeadContacted,
  SalesLeadDto,
  updateBackendSalesLead,
} from "@/lib/sales/admin-sales-lead-client";
import { salesLeadHistoryToCsv, salesLeadsToCsv, downloadCsv } from "@/lib/export/local-csv";
import {
  renderSalesEmailTemplate,
  salesEmailTemplates,
  SalesEmailTemplateKey,
} from "@/lib/sales/sales-email-templates";
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";
import { WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

const STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SENT",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "DO_NOT_CONTACT",
] as const;

type ImportRow = {
  businessName: string;
  location?: string;
  industryLabel?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source?: string;
};

function normalizeHeader(name: string): string {
  return name.trim().toLowerCase().replaceAll(" ", "").replaceAll("_", "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function mapCsvRowsToLeads(rows: string[][]): { valid: ImportRow[]; skipped: string[] } {
  if (rows.length === 0) {
    return { valid: [], skipped: ["CSV is empty"] };
  }

  const headers = rows[0].map(normalizeHeader);
  const index = {
    businessName: headers.findIndex((h) => ["businessname", "business"].includes(h)),
    location: headers.findIndex((h) => ["location", "town", "city", "area"].includes(h)),
    industry: headers.findIndex((h) => ["industry", "type", "industrytype"].includes(h)),
    contactName: headers.findIndex((h) => ["contactname", "contact", "name"].includes(h)),
    email: headers.findIndex((h) => ["email", "emailaddress"].includes(h)),
    phone: headers.findIndex((h) => ["telephone", "phone", "tel", "mobile"].includes(h)),
  };

  const valid: ImportRow[] = [];
  const skipped: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const businessName = index.businessName >= 0 ? row[index.businessName] ?? "" : "";
    if (!businessName.trim()) {
      skipped.push(`Row ${i + 1}: missing businessName`);
      continue;
    }

    valid.push({
      businessName: businessName.trim(),
      location: index.location >= 0 ? row[index.location]?.trim() : undefined,
      industryLabel: index.industry >= 0 ? row[index.industry]?.trim() : undefined,
      contactName: index.contactName >= 0 ? row[index.contactName]?.trim() : undefined,
      email: index.email >= 0 ? row[index.email]?.trim() : undefined,
      phone: index.phone >= 0 ? row[index.phone]?.trim() : undefined,
      source: "csv",
    });
  }

  return { valid, skipped };
}

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminSalesPage() {
  const [leads, setLeads] = useState<SalesLeadDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [importPreview, setImportPreview] = useState<ImportRow[]>([]);
  const [importSkipped, setImportSkipped] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [templateKey, setTemplateKey] = useState<SalesEmailTemplateKey>("INITIAL_OUTREACH");

  const [formState, setFormState] = useState({
    businessName: "",
    location: "",
    industrySlug: "",
    industryLabel: "",
    contactName: "",
    email: "",
    phone: "",
    status: "NEW",
    source: "manual",
    notes: "",
    nextFollowUpAt: "",
  });

  async function loadLeads() {
    setLoading(true);
    setError(null);
    const result = await listBackendSalesLeads({
      search: search.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      industrySlug: industryFilter === "ALL" ? undefined : industryFilter,
      location: locationFilter.trim() || undefined,
    });

    if (!result.ok) {
      setLeads([]);
      setError(result.error);
      setLoading(false);
      return;
    }

    setLeads(result.leads);
    if (result.leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(result.leads[0].id);
    }
    setLoading(false);
  }

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null,
    [leads, selectedLeadId],
  );

  const counts = useMemo(() => {
    const total = leads.length;
    const completed = leads.filter((lead) => lead.status === "WON").length;
    const open = leads.filter((lead) => !["WON", "LOST", "DO_NOT_CONTACT"].includes(lead.status)).length;
    return { total, completed, open };
  }, [leads]);

  const selectedTemplate = salesEmailTemplates.find((template) => template.key === templateKey) ?? salesEmailTemplates[0];

  const emailPreview = selectedLead
    ? renderSalesEmailTemplate(selectedTemplate, {
        businessName: selectedLead.businessName,
        contactName: selectedLead.contactName ?? "",
        industry: selectedLead.industryLabel ?? selectedLead.industrySlug ?? "",
        demoLink: `https://www.myexperiment.club/demo/${selectedLead.industrySlug ?? "barbers"}`,
        pricingSummary: "£149 setup + £30/month (+£10/month optional WhatsApp)",
        senderName: "MyExperiment.club",
      })
    : null;

  async function handleCreateLead() {
    setError(null);
    const payload = {
      businessName: formState.businessName,
      location: formState.location || undefined,
      industrySlug: formState.industrySlug || undefined,
      industryLabel: formState.industryLabel || undefined,
      contactName: formState.contactName || undefined,
      email: formState.email || undefined,
      phone: formState.phone || undefined,
      status: formState.status,
      source: formState.source || "manual",
      notes: formState.notes || undefined,
      nextFollowUpAt: formState.nextFollowUpAt || undefined,
    };

    const result = await createBackendSalesLead(payload);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSelectedLeadId(result.lead.id);
    setFormState({
      businessName: "",
      location: "",
      industrySlug: "",
      industryLabel: "",
      contactName: "",
      email: "",
      phone: "",
      status: "NEW",
      source: "manual",
      notes: "",
      nextFollowUpAt: "",
    });
    await loadLeads();
  }

  async function handleUpdateLead(lead: SalesLeadDto, patch: Record<string, unknown>) {
    setError(null);
    const result = await updateBackendSalesLead(lead.id, patch);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const detail = await getBackendSalesLead(lead.id);
    if (detail.ok) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? detail.lead : item)));
    } else {
      await loadLeads();
    }
  }

  async function handleMarkContacted() {
    if (!selectedLead) return;
    setError(null);
    const result = await markBackendSalesLeadContacted(selectedLead.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await loadLeads();
  }

  async function handleImport() {
    if (importPreview.length === 0) return;
    setIsImporting(true);
    setError(null);

    for (const row of importPreview) {
      const result = await createBackendSalesLead({
        businessName: row.businessName,
        location: row.location,
        industryLabel: row.industryLabel,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        source: row.source ?? "csv",
        status: "NEW",
      });
      if (!result.ok) {
        setError(`Import stopped: ${result.error}`);
        setIsImporting(false);
        return;
      }
    }

    setImportPreview([]);
    setImportSkipped([]);
    setIsImporting(false);
    await loadLeads();
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    const parsed = mapCsvRowsToLeads(rows);
    setImportPreview(parsed.valid);
    setImportSkipped(parsed.skipped);
    event.target.value = "";
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Prospect workflow for MyExperiment.club outreach. Separate from customer CRM.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
      </div>

      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Marketing email sending is not enabled. Use template preview/copy only. Real sending needs provider setup,
        unsubscribe handling, and compliance controls.
      </p>

      <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Add lead</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Business name *" value={formState.businessName} onChange={(e) => setFormState((c) => ({ ...c, businessName: e.target.value }))} />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Location" value={formState.location} onChange={(e) => setFormState((c) => ({ ...c, location: e.target.value }))} />
            <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.industrySlug} onChange={(e) => setFormState((c) => ({ ...c, industrySlug: e.target.value }))}>
              <option value="">Industry slug (optional)</option>
              {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
            </select>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Industry label" value={formState.industryLabel} onChange={(e) => setFormState((c) => ({ ...c, industryLabel: e.target.value }))} />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Contact name" value={formState.contactName} onChange={(e) => setFormState((c) => ({ ...c, contactName: e.target.value }))} />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Email" value={formState.email} onChange={(e) => setFormState((c) => ({ ...c, email: e.target.value }))} />
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Phone" value={formState.phone} onChange={(e) => setFormState((c) => ({ ...c, phone: e.target.value }))} />
            <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.status} onChange={(e) => setFormState((c) => ({ ...c, status: e.target.value }))}>
              {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Source (manual, csv, referral)" value={formState.source} onChange={(e) => setFormState((c) => ({ ...c, source: e.target.value }))} />
            <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.nextFollowUpAt} onChange={(e) => setFormState((c) => ({ ...c, nextFollowUpAt: e.target.value }))} />
          </div>
          <textarea className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Notes" value={formState.notes} onChange={(e) => setFormState((c) => ({ ...c, notes: e.target.value }))} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void handleCreateLead()}>
              Add lead
            </button>
            <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void loadLeads()}>
              Reload leads
            </button>
            <button type="button" className={`${secondaryButtonClass} ${smallButtonClass}`} onClick={() => downloadCsv("sales-leads.csv", salesLeadsToCsv(leads))}>
              Export leads CSV
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">CSV import</h2>
          <p className="mt-1 text-xs text-slate-600">Required column: businessName (or Business Name/business_name).</p>
          <input className="mt-3 block w-full text-sm" type="file" accept=".csv,text/csv" onChange={(e) => void handleFileUpload(e)} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void handleImport()} disabled={importPreview.length === 0 || isImporting}>
              Import preview rows ({importPreview.length})
            </button>
            <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => { setImportPreview([]); setImportSkipped([]); }}>
              Clear preview
            </button>
          </div>
          {importSkipped.length > 0 ? (
            <ul className="mt-3 list-disc pl-5 text-xs text-amber-700">
              {importSkipped.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">Total leads: <span className="font-semibold">{counts.total}</span></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">Won: <span className="font-semibold">{counts.completed}</span></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm">Open pipeline: <span className="font-semibold">{counts.open}</span></div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Search business/contact/email/phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Location filter" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
            <option value="ALL">All industries</option>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void loadLeads()}>Apply filters</button>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        {loading ? <p className="mt-3 text-sm text-slate-600">Loading leads...</p> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-2 max-h-[620px] overflow-auto pr-1">
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full rounded-lg border p-3 text-left ${selectedLead?.id === lead.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}
              >
                <p className="text-sm font-semibold text-slate-900">{lead.businessName}</p>
                <p className="text-xs text-slate-600">{lead.contactName || "No contact name"}</p>
                <p className="text-xs text-slate-600">{lead.location || "No location"}</p>
                <p className="mt-1 text-xs text-slate-700">{statusLabel(lead.status)}</p>
                <p className="text-[11px] text-slate-500">Created: {formatUkDateTime(lead.createdAt)}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {!selectedLead ? (
              <p className="text-sm text-slate-600">Select a lead to inspect details.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedLead.businessName}</h3>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => downloadCsv(`sales-lead-history-${selectedLead.id}.csv`, salesLeadHistoryToCsv(selectedLead.events ?? []))}>Export history CSV</button>
                    <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void handleMarkContacted()}>Mark as contacted</button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <p><span className="font-semibold">Industry:</span> {selectedLead.industryLabel || selectedLead.industrySlug || "N/A"}</p>
                  <p><span className="font-semibold">Status:</span> {statusLabel(selectedLead.status)}</p>
                  <p><span className="font-semibold">Contact:</span> {selectedLead.contactName || "N/A"}</p>
                  <p><span className="font-semibold">Email:</span> {selectedLead.email || "N/A"}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedLead.phone || "N/A"}</p>
                  <p><span className="font-semibold">Location:</span> {selectedLead.location || "N/A"}</p>
                  <p><span className="font-semibold">Last contacted:</span> {selectedLead.lastContactedAt ? formatUkDateTime(selectedLead.lastContactedAt) : "Not yet"}</p>
                  <p><span className="font-semibold">Next follow-up:</span> {selectedLead.nextFollowUpAt ? formatUkDate(selectedLead.nextFollowUpAt) : "Not set"}</p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={selectedLead.status} onChange={(e) => void handleUpdateLead(selectedLead, { status: e.target.value })}>
                    {STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                  </select>
                  <input type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={selectedLead.nextFollowUpAt ? selectedLead.nextFollowUpAt.slice(0, 10) : ""} onBlur={(e) => void handleUpdateLead(selectedLead, { nextFollowUpAt: e.target.value || null })} />
                </div>

                <textarea className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={selectedLead.notes ?? ""} placeholder="Lead notes" onBlur={(e) => void handleUpdateLead(selectedLead, { notes: e.target.value })} />

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Marketing email template preview (copy only)</h4>
                  <p className="mt-1 text-xs text-slate-600">No real sending is implemented in this system yet.</p>
                  <select className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={templateKey} onChange={(e) => setTemplateKey(e.target.value as SalesEmailTemplateKey)}>
                    {salesEmailTemplates.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
                  </select>
                  {emailPreview ? (
                    <>
                      <p className="mt-2 text-xs font-semibold text-slate-700">Subject</p>
                      <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-800">{emailPreview.subject}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">Body</p>
                      <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800">{emailPreview.body}</pre>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`${outlineButtonClass} ${smallButtonClass}`}
                          onClick={async () => {
                            await navigator.clipboard.writeText(`Subject: ${emailPreview.subject}\n\n${emailPreview.body}`);
                          }}
                        >
                          Copy email
                        </button>
                        <button type="button" className={`${secondaryButtonClass} ${smallButtonClass}`} onClick={() => void handleMarkContacted()}>
                          Mark as contacted
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Lead event timeline</h4>
                  {(selectedLead.events ?? []).length === 0 ? (
                    <p className="mt-1 text-xs text-slate-600">No events yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-xs text-slate-700">
                      {(selectedLead.events ?? []).map((event) => (
                        <li key={event.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                          <span className="font-semibold">{event.eventType}</span> - {event.message || "No message"} ({formatUkDateTime(event.createdAt)})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
