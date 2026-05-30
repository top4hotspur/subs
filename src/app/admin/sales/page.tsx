"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import {
  createBackendSalesLead,
  listBackendSalesLeads,
  SalesLeadDto,
} from "@/lib/sales/admin-sales-lead-client";
import {
  createBackendSalesCampaign,
  listBackendSalesCampaigns,
  SalesCampaignDto,
  updateBackendSalesCampaign,
} from "@/lib/sales/admin-sales-campaign-client";
import {
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { formatUkDateTime } from "@/lib/ui/display-labels";

type ImportRow = {
  businessName: string;
  country?: string;
  cityTown?: string;
  postcode?: string;
  address?: string;
  industrySlug?: string;
  serviceArea?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  leadSource?: string;
  sourceUrl?: string;
  currentProvider?: string;
  estimatedCurrentMonthlyCost?: string;
  notes?: string;
};

type ImportDecision = "PENDING" | "APPROVED" | "SKIPPED";
type ImportHealth = "CLEAN" | "POSSIBLE_DUPLICATE" | "MISSING_REQUIRED";

type ImportPreviewRow = {
  rowNumber: number;
  row: ImportRow;
  health: ImportHealth;
  duplicateReasons: string[];
  decision: ImportDecision;
};

const TEMPLATE_COLUMNS = [
  "businessName",
  "country",
  "cityTown",
  "postcode",
  "address",
  "industrySlug",
  "serviceArea",
  "contactName",
  "email",
  "phone",
  "leadSource",
  "sourceUrl",
  "currentProvider",
  "estimatedCurrentMonthlyCost",
  "notes",
];

const LEAD_SOURCES = ["Booksy", "Google Maps", "Facebook", "Manual", "Referral", "Other"];
const CURRENT_PROVIDERS = ["Booksy", "Fresha", "Wix", "Squarespace", "WordPress", "None", "Unknown", "Other"];
const MARKETING_STATUSES = ["ACTIVE", "DO_NOT_CONTACT", "UNSUBSCRIBED", "BOUNCED"] as const;
const CAMPAIGN_LEVELS = ["LAUNCH_OFFER", "INTRODUCTION", "REMINDER"] as const;

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
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

function campaignLevelLabel(level: (typeof CAMPAIGN_LEVELS)[number]): string {
  if (level === "LAUNCH_OFFER") return "Launch offer";
  if (level === "INTRODUCTION") return "Introduction";
  return "Reminder";
}

function buildCampaignPreviewCopy(
  level: (typeof CAMPAIGN_LEVELS)[number],
  lead: SalesLeadDto | null,
  industrySlug: string,
) {
  const businessName = lead?.businessName ?? "your business";
  const providerLine =
    lead?.currentProvider?.toLowerCase() === "booksy"
      ? "If you are currently using Booksy, we can help you move to a lower monthly cost with more control over your site and feature roadmap."
      : "If you are paying for separate website and booking tools, we can usually lower complexity and cost.";

  if (level === "LAUNCH_OFFER") {
    return `Hi ${businessName},

We are opening a limited launch offer for selected local ${industrySlug} businesses.
For early customers in this service area, setup can be reduced to £0 for a limited number of places.

You will get direct support, faster feedback loops, and the chance to request practical feature improvements specific to your service.
${providerLine}

View your industry demo: /demo/${industrySlug}
Unsubscribe (placeholder): /unsubscribe/sales?token=<token>`;
  }
  if (level === "INTRODUCTION") {
    return `Hi ${businessName},

MyExperiment.club builds professional managed websites for local ${industrySlug} businesses.
Pricing is simple: £149 setup + £30/month.

You get customer booking/enquiry flows, business admin controls, and staff operations support in one managed platform.
${providerLine}

View your industry demo: /demo/${industrySlug}
Unsubscribe (placeholder): /unsubscribe/sales?token=<token>`;
  }
  return `Hi ${businessName},

Quick follow-up in case you missed our last message.
For this reminder campaign, setup can be reduced to £99 for qualifying businesses.

If you want a cleaner website + operations setup for your ${industrySlug} business, we can help you get live quickly.

View your industry demo: /demo/${industrySlug}
Unsubscribe (placeholder): /unsubscribe/sales?token=<token>`;
}

export default function AdminSalesPage() {
  const [leads, setLeads] = useState<SalesLeadDto[]>([]);
  const [campaigns, setCampaigns] = useState<SalesCampaignDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([]);
  const [campaignIndustry, setCampaignIndustry] = useState("barbers");
  const [campaignServiceArea, setCampaignServiceArea] = useState("");
  const [campaignLevel, setCampaignLevel] = useState<(typeof CAMPAIGN_LEVELS)[number]>("INTRODUCTION");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");

  const [formState, setFormState] = useState({
    businessName: "",
    country: "",
    cityTown: "",
    postcode: "",
    address: "",
    industrySlug: "",
    serviceArea: "",
    contactName: "",
    email: "",
    phone: "",
    leadSource: "",
    sourceUrl: "",
    currentProvider: "",
    estimatedCurrentMonthlyCost: "",
    notes: "",
    marketingStatus: "ACTIVE",
  });

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [leadResult, campaignResult] = await Promise.all([
      listBackendSalesLeads(),
      listBackendSalesCampaigns(),
    ]);
    if (!leadResult.ok) {
      setError(leadResult.error);
      setLeads([]);
    } else {
      setLeads(leadResult.leads);
      if (!selectedLeadId && leadResult.leads.length) {
        setSelectedLeadId(leadResult.leads[0].id);
      }
    }
    if (!campaignResult.ok) {
      setCampaigns([]);
    } else {
      setCampaigns(campaignResult.campaigns);
    }
    setLoading(false);
  }

  function downloadTemplate() {
    const csv = `${TEMPLATE_COLUMNS.join(",")}\nAcme Hair Studio,England,Leeds,LS1 1AA,1 High Street,hairdressers,Leeds Centre,Jane Doe,jane@acme.co.uk,07123456789,Google Maps,https://maps.google.com,Booksy,99,Interested in switching\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sales-leads-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function detectDuplicateReasons(row: ImportRow, allRows: ImportRow[], existing: SalesLeadDto[]) {
    const reasons: string[] = [];
    if (row.postcode && row.industrySlug) {
      const samePreview = allRows.filter(
        (item) =>
          item !== row &&
          item.postcode?.toLowerCase() === row.postcode?.toLowerCase() &&
          item.industrySlug?.toLowerCase() === row.industrySlug?.toLowerCase(),
      ).length;
      const sameExisting = existing.filter(
        (lead) =>
          lead.postcode?.toLowerCase() === row.postcode?.toLowerCase() &&
          lead.industrySlug?.toLowerCase() === row.industrySlug?.toLowerCase(),
      ).length;
      if (samePreview + sameExisting > 0) reasons.push("Possible duplicate: same postcode and industry");
    }

    if (row.businessName && row.postcode) {
      const sameBusinessPostcode = existing.some(
        (lead) =>
          lead.businessName.toLowerCase() === row.businessName.toLowerCase() &&
          lead.postcode?.toLowerCase() === row.postcode?.toLowerCase(),
      );
      if (sameBusinessPostcode) reasons.push("Possible duplicate: same business name and postcode");
    }

    if (row.email && existing.some((lead) => lead.email?.toLowerCase() === row.email?.toLowerCase())) {
      reasons.push("Possible duplicate: same email");
    }
    if (row.phone && existing.some((lead) => lead.phone?.trim() === row.phone?.trim())) {
      reasons.push("Possible duplicate: same phone");
    }

    return reasons;
  }

  async function onCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) return;

    const headers = rows[0].map(normalizeHeader);
    const getCell = (row: string[], names: string[]) => {
      const index = headers.findIndex((h) => names.includes(h));
      return index >= 0 ? row[index]?.trim() : undefined;
    };

    const parsedRows: ImportRow[] = rows.slice(1).map((row) => ({
      businessName: getCell(row, ["businessname", "business"]) ?? "",
      country: getCell(row, ["country"]),
      cityTown: getCell(row, ["citytown", "city", "town"]),
      postcode: getCell(row, ["postcode", "zip"]),
      address: getCell(row, ["address", "location"]),
      industrySlug: getCell(row, ["industryslug", "industry"]),
      serviceArea: getCell(row, ["servicearea"]),
      contactName: getCell(row, ["contactname", "contact"]),
      email: getCell(row, ["email"]),
      phone: getCell(row, ["phone", "telephone", "mobile"]),
      leadSource: getCell(row, ["leadsource", "source"]),
      sourceUrl: getCell(row, ["sourceurl"]),
      currentProvider: getCell(row, ["currentprovider"]),
      estimatedCurrentMonthlyCost: getCell(row, ["estimatedcurrentmonthlycost"]),
      notes: getCell(row, ["notes"]),
    }));

    const previewRows: ImportPreviewRow[] = parsedRows.map((row, index) => {
      const duplicateReasons = detectDuplicateReasons(row, parsedRows, leads);
      const missingRequired = !row.businessName.trim();
      const health: ImportHealth = missingRequired
        ? "MISSING_REQUIRED"
        : duplicateReasons.length
          ? "POSSIBLE_DUPLICATE"
          : "CLEAN";
      return {
        rowNumber: index + 2,
        row,
        health,
        duplicateReasons,
        decision: health === "POSSIBLE_DUPLICATE" ? "PENDING" : health === "MISSING_REQUIRED" ? "SKIPPED" : "APPROVED",
      };
    });

    setImportRows(previewRows);
    event.target.value = "";
  }

  async function importApprovedRows() {
    setLoading(true);
    setError(null);
    for (const preview of importRows) {
      if (preview.decision !== "APPROVED") continue;
      const payload = {
        businessName: preview.row.businessName,
        country: preview.row.country || undefined,
        cityTown: preview.row.cityTown || undefined,
        postcode: preview.row.postcode || undefined,
        address: preview.row.address || undefined,
        location: preview.row.address || undefined,
        industrySlug: preview.row.industrySlug || undefined,
        serviceArea: preview.row.serviceArea || undefined,
        contactName: preview.row.contactName || undefined,
        email: preview.row.email || undefined,
        phone: preview.row.phone || undefined,
        leadSource: preview.row.leadSource || undefined,
        sourceUrl: preview.row.sourceUrl || undefined,
        currentProvider: preview.row.currentProvider || undefined,
        estimatedCurrentMonthlyCost: preview.row.estimatedCurrentMonthlyCost
          ? Number(preview.row.estimatedCurrentMonthlyCost)
          : undefined,
        notes: preview.row.notes || undefined,
        source: "csv",
        status: "NEW",
        marketingStatus: "ACTIVE",
      };
      const result = await createBackendSalesLead(payload);
      if (!result.ok) {
        setError(`Import stopped on row ${preview.rowNumber}: ${result.error}`);
        break;
      }
    }
    await loadAll();
    setLoading(false);
  }

  async function createLead() {
    setError(null);
    const result = await createBackendSalesLead({
      businessName: formState.businessName,
      country: formState.country || undefined,
      cityTown: formState.cityTown || undefined,
      postcode: formState.postcode || undefined,
      address: formState.address || undefined,
      location: formState.address || undefined,
      industrySlug: formState.industrySlug || undefined,
      serviceArea: formState.serviceArea || undefined,
      contactName: formState.contactName || undefined,
      email: formState.email || undefined,
      phone: formState.phone || undefined,
      leadSource: formState.leadSource || undefined,
      sourceUrl: formState.sourceUrl || undefined,
      currentProvider: formState.currentProvider || undefined,
      estimatedCurrentMonthlyCost: formState.estimatedCurrentMonthlyCost
        ? Number(formState.estimatedCurrentMonthlyCost)
        : undefined,
      notes: formState.notes || undefined,
      marketingStatus: formState.marketingStatus,
      source: "manual",
      status: "NEW",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFormState({
      businessName: "",
      country: "",
      cityTown: "",
      postcode: "",
      address: "",
      industrySlug: "",
      serviceArea: "",
      contactName: "",
      email: "",
      phone: "",
      leadSource: "",
      sourceUrl: "",
      currentProvider: "",
      estimatedCurrentMonthlyCost: "",
      notes: "",
      marketingStatus: "ACTIVE",
    });
    await loadAll();
  }

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const eligibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (lead.marketingStatus && lead.marketingStatus !== "ACTIVE") return false;
      if (campaignIndustry && lead.industrySlug !== campaignIndustry) return false;
      if (campaignServiceArea && lead.serviceArea?.toLowerCase() !== campaignServiceArea.toLowerCase()) return false;
      return true;
    });
  }, [leads, campaignIndustry, campaignServiceArea]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Import prospects, review duplicates, segment campaigns, and prepare outreach safely.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
      </div>
      <AdminPillNav />

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={downloadTemplate}>
          Download leads CSV template
        </button>
        <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void loadAll()}>
          {loading ? "Loading..." : "Reload leads/campaigns"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">1. Add or import leads</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Business name *" value={formState.businessName} onChange={(e) => setFormState((c) => ({ ...c, businessName: e.target.value }))} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.industrySlug} onChange={(e) => setFormState((c) => ({ ...c, industrySlug: e.target.value }))}>
            <option value="">Industry</option>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
          </select>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Service area" value={formState.serviceArea} onChange={(e) => setFormState((c) => ({ ...c, serviceArea: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Postcode" value={formState.postcode} onChange={(e) => setFormState((c) => ({ ...c, postcode: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="City / town" value={formState.cityTown} onChange={(e) => setFormState((c) => ({ ...c, cityTown: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Address" value={formState.address} onChange={(e) => setFormState((c) => ({ ...c, address: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Contact name" value={formState.contactName} onChange={(e) => setFormState((c) => ({ ...c, contactName: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Email" value={formState.email} onChange={(e) => setFormState((c) => ({ ...c, email: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Phone" value={formState.phone} onChange={(e) => setFormState((c) => ({ ...c, phone: e.target.value }))} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.leadSource} onChange={(e) => setFormState((c) => ({ ...c, leadSource: e.target.value }))}>
            <option value="">Lead source</option>
            {LEAD_SOURCES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Source URL" value={formState.sourceUrl} onChange={(e) => setFormState((c) => ({ ...c, sourceUrl: e.target.value }))} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.currentProvider} onChange={(e) => setFormState((c) => ({ ...c, currentProvider: e.target.value }))}>
            <option value="">Current provider</option>
            {CURRENT_PROVIDERS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Estimated current monthly cost (£)" value={formState.estimatedCurrentMonthlyCost} onChange={(e) => setFormState((c) => ({ ...c, estimatedCurrentMonthlyCost: e.target.value }))} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={formState.marketingStatus} onChange={(e) => setFormState((c) => ({ ...c, marketingStatus: e.target.value }))}>
            {MARKETING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <textarea className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Notes" value={formState.notes} onChange={(e) => setFormState((c) => ({ ...c, notes: e.target.value }))} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void createLead()}>
            Add lead
          </button>
          <label className={`${secondaryButtonClass} ${smallButtonClass} cursor-pointer`}>
            Upload CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onCsvUpload(e)} />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">2. Duplicate review</h2>
        <p className="mt-1 text-sm text-slate-600">
          Duplicate checks include: postcode + industry, business name + postcode, email, and phone.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setImportRows((current) => current.map((row) => row.health === "POSSIBLE_DUPLICATE" ? { ...row, decision: "SKIPPED" } : row))}>
            Skip all duplicates
          </button>
          <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setImportRows((current) => current.map((row) => row.health === "POSSIBLE_DUPLICATE" ? { ...row, decision: "APPROVED" } : row))}>
            Approve all duplicates
          </button>
          <button type="button" className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void importApprovedRows()} disabled={!importRows.some((row) => row.decision === "APPROVED")}>
            Import approved rows
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {importRows.length === 0 ? (
            <p className="text-sm text-slate-600">No CSV preview loaded.</p>
          ) : importRows.map((preview) => (
            <div key={preview.rowNumber} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">Row {preview.rowNumber}: {preview.row.businessName || "(missing business name)"}</p>
              <p className="text-slate-700">Status: {preview.health === "CLEAN" ? "Clean" : preview.health === "POSSIBLE_DUPLICATE" ? "Possible duplicate" : "Missing required fields"}</p>
              {preview.duplicateReasons.map((reason) => <p key={reason} className="text-amber-700">{reason}</p>)}
              <p className="text-slate-700">Decision: {preview.decision}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setImportRows((current) => current.map((row) => row.rowNumber === preview.rowNumber ? { ...row, decision: "APPROVED" } : row))}>
                  Approve
                </button>
                <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setImportRows((current) => current.map((row) => row.rowNumber === preview.rowNumber ? { ...row, decision: "SKIPPED" } : row))}>
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">3. Lead list and filters</h2>
        <p className="mt-1 text-sm text-slate-600">Total leads: {leads.length}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left ${selectedLeadId === lead.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}
                onClick={() => setSelectedLeadId(lead.id)}
              >
                <p className="font-semibold text-slate-900">{lead.businessName}</p>
                <p className="text-xs text-slate-700">{lead.industrySlug ?? "no industry"} · {lead.serviceArea ?? "no service area"}</p>
                <p className="text-xs text-slate-600">{lead.postcode ?? "no postcode"} · {lead.marketingStatus ?? "ACTIVE"}</p>
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            {!selectedLead ? (
              <p className="text-slate-600">Select a lead to inspect details.</p>
            ) : (
              <>
                <p className="font-semibold text-slate-900">{selectedLead.businessName}</p>
                <p className="mt-1 text-slate-700">Industry: {selectedLead.industrySlug ?? "N/A"}</p>
                <p className="text-slate-700">Service area: {selectedLead.serviceArea ?? "N/A"}</p>
                <p className="text-slate-700">Postcode: {selectedLead.postcode ?? "N/A"}</p>
                <p className="text-slate-700">Lead source: {selectedLead.leadSource ?? "N/A"}</p>
                <p className="text-slate-700">Current provider: {selectedLead.currentProvider ?? "N/A"}</p>
                <p className="text-slate-700">Estimated monthly cost: {selectedLead.estimatedCurrentMonthlyCost ?? "N/A"}</p>
                <p className="text-slate-700">Marketing status: {selectedLead.marketingStatus ?? "ACTIVE"}</p>
                <p className="mt-1 text-xs text-slate-600">Created: {formatUkDateTime(selectedLead.createdAt)}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">4. Campaign builder</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={campaignIndustry} onChange={(e) => setCampaignIndustry(e.target.value)}>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{slug}</option>)}
          </select>
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Service area filter (optional)" value={campaignServiceArea} onChange={(e) => setCampaignServiceArea(e.target.value)} />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={campaignLevel} onChange={(e) => setCampaignLevel(e.target.value as (typeof CAMPAIGN_LEVELS)[number])}>
            {CAMPAIGN_LEVELS.map((level) => <option key={level} value={level}>{campaignLevelLabel(level)}</option>)}
          </select>
        </div>
        <p className="mt-3 text-sm text-slate-700">Eligible leads: {eligibleLeads.length}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={async () => {
              const name = `${campaignLevelLabel(campaignLevel)} - ${campaignIndustry}${campaignServiceArea ? ` - ${campaignServiceArea}` : ""}`;
              const result = await createBackendSalesCampaign({
                name,
                industrySlug: campaignIndustry,
                serviceArea: campaignServiceArea || undefined,
                campaignLevel,
                status: "DRAFT",
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              await loadAll();
            }}
          >
            Mark campaign prepared
          </button>
          <button
            type="button"
            className={`${outlineButtonClass} ${smallButtonClass}`}
            onClick={async () => {
              if (!campaigns.length) return;
              const latest = campaigns[0];
              const result = await updateBackendSalesCampaign(latest.id, { status: "SENT" });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              await loadAll();
            }}
          >
            Mark as sent manually
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {campaigns.slice(0, 6).map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-slate-900">{campaign.name}</p>
              <p className="text-slate-700">{campaignLevelLabel(campaign.campaignLevel)} · {campaign.status} · {formatUkDateTime(campaign.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">5. Campaign preview and tracking readiness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Preview-only templates. Live bulk sending is not enabled in this pass.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
          {buildCampaignPreviewCopy(campaignLevel, selectedLead, campaignIndustry)}
        </pre>
        <p className="mt-3 text-sm text-slate-700">
          Suppression rule: leads with marketing status DO_NOT_CONTACT, UNSUBSCRIBED, or BOUNCED must not receive campaigns.
        </p>
        <p className="text-sm text-slate-700">
          Webhook foundation route: <code>/api/resend/webhook</code> (currently returns 501 until verified signature handling is implemented).
        </p>
      </section>
    </main>
  );
}
