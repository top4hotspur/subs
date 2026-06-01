"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import {
  createBackendSalesLead,
  listBackendSalesLeads,
  SalesLeadDto,
  updateBackendSalesLead,
} from "@/lib/sales/admin-sales-lead-client";
import {
  createBackendSalesCampaign,
  listBackendSalesCampaigns,
  listBackendSalesCampaignTemplates,
  markBackendSalesCampaignPrepared,
  markBackendSalesCampaignSentManual,
  SalesCampaignDto,
  SalesCampaignTemplateDto,
  saveBackendSalesCampaignTemplate,
} from "@/lib/sales/admin-sales-campaign-client";
import {
  listBackendSalesProviderPricing,
  saveBackendSalesProviderPricing,
  SalesProviderPricingDto,
} from "@/lib/sales/admin-sales-provider-pricing-client";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";
import { formatUkDateTime } from "@/lib/ui/display-labels";

type TemplateKey = "EMAIL_INTRODUCTION" | "EMAIL_REMINDER" | "SNAIL_MAIL_LETTER";
type CampaignLevel = "LAUNCH_OFFER" | "INTRODUCTION" | "REMINDER";

const TEMPLATE_KEYS: Array<{ key: TemplateKey; label: string; channel: "EMAIL" | "LETTER" }> = [
  { key: "EMAIL_INTRODUCTION", label: "Email 1 / Introduction", channel: "EMAIL" },
  { key: "EMAIL_REMINDER", label: "Email 2 / Reminder", channel: "EMAIL" },
  { key: "SNAIL_MAIL_LETTER", label: "Snail mail / Letter", channel: "LETTER" },
];

const MARKETING_STATUSES = ["ACTIVE", "DO_NOT_CONTACT", "UNSUBSCRIBED", "BOUNCED", "CONVERTED"];

const LEADS_CSV_TEMPLATE_HEADERS = [
  "businessName",
  "country",
  "cityTown",
  "postcode",
  "address",
  "industrySlug",
  "contactName",
  "email",
  "phone",
  "leadSource",
  "sourceUrl",
  "currentProvider",
  "estimatedCurrentMonthlyCost",
  "notes",
] as const;

const LEADS_CSV_TEMPLATE_EXAMPLE = [
  "Luna Hair Studio",
  "England",
  "Bristol",
  "BS1 4DJ",
  "1 Broad Quay, Bristol",
  "hairdressers",
  "Steven Glass",
  "stevenglass@hotmail.com",
  "07123456789",
  "Google Maps",
  "https://maps.google.com",
  "Booksy",
  "",
  "Interested in moving this month",
] as const;

function formatIndustryLabel(slug: string): string {
  return slug
    .split("-")
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function campaignLevelLabel(level: CampaignLevel): string {
  if (level === "LAUNCH_OFFER") return "Launch offer";
  if (level === "INTRODUCTION") return "Introduction";
  return "Reminder";
}

function defaultTemplateKeyForLevel(level: CampaignLevel): TemplateKey {
  return level === "REMINDER" ? "EMAIL_REMINDER" : "EMAIL_INTRODUCTION";
}

function renderTemplate(template: SalesCampaignTemplateDto, lead: SalesLeadDto | null, industry: string) {
  const values: Record<string, string> = {
    businessName: lead?.businessName ?? "your business",
    contactName: lead?.contactName ?? "there",
    industry: industry || lead?.industrySlug || "local services",
    currentProvider: lead?.currentProvider ?? "current provider",
    estimatedCurrentMonthlyCost: String(lead?.estimatedCurrentMonthlyCost ?? "unknown"),
    demoLink: `/demo/${industry || lead?.industrySlug || "barbers"}`,
    unsubscribeLink: "/unsubscribe/sales?token=<token>",
  };
  let subject = template.subject ?? "";
  let body = template.body;
  for (const [k, v] of Object.entries(values)) {
    subject = subject.replaceAll(`{{${k}}}`, v);
    body = body.replaceAll(`{{${k}}}`, v);
  }
  return { subject, body };
}

function parseCsvRows(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];
  const headers = lines[0].split(",").map((x) => x.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const out: Record<string, string> = {};
    headers.forEach((h, i) => {
      out[h] = cols[i]?.trim() ?? "";
    });
    return out;
  });
}

function downloadLeadsCsvTemplate() {
  const csv = `${LEADS_CSV_TEMPLATE_HEADERS.join(",")}\n${LEADS_CSV_TEMPLATE_EXAMPLE.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sales-leads-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminSalesPage() {
  const [leads, setLeads] = useState<SalesLeadDto[]>([]);
  const [campaigns, setCampaigns] = useState<SalesCampaignDto[]>([]);
  const [templates, setTemplates] = useState<SalesCampaignTemplateDto[]>([]);
  const [providers, setProviders] = useState<SalesProviderPricingDto[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TemplateKey>("EMAIL_INTRODUCTION");
  const [campaignLevel, setCampaignLevel] = useState<CampaignLevel>("INTRODUCTION");
  const [campaignIndustry, setCampaignIndustry] = useState("barbers");
  const [campaignServiceArea, setCampaignServiceArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    industrySlug: "",
    contactName: "",
    email: "",
    phone: "",
    postcode: "",
    cityTown: "",
    address: "",
    currentProvider: "",
    estimatedCurrentMonthlyCost: "",
    estimatedCostAutoFilled: false,
    marketingStatus: "ACTIVE",
  });
  const [providerForm, setProviderForm] = useState({
    providerKey: "",
    providerName: "",
    estimatedMonthlyGbp: "",
    notes: "",
    active: true,
  });

  const selectedLead = useMemo(() => leads.find((x) => x.id === selectedLeadId) ?? null, [leads, selectedLeadId]);
  const selectedCampaign = useMemo(
    () => campaigns.find((x) => x.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((x) => x.templateKey === selectedTemplateKey) ?? null,
    [templates, selectedTemplateKey],
  );

  const candidates = useMemo(() => {
    return leads
      .filter((lead) => !campaignIndustry || lead.industrySlug === campaignIndustry)
      .filter((lead) => !campaignServiceArea || lead.serviceArea?.toLowerCase() === campaignServiceArea.toLowerCase())
      .map((lead) => {
        const reasons: string[] = [];
        if (["UNSUBSCRIBED", "DO_NOT_CONTACT", "BOUNCED", "CONVERTED"].includes(lead.marketingStatus ?? "ACTIVE")) {
          reasons.push(`suppressed (${lead.marketingStatus})`);
        }
        if (lead.snoozedUntil && new Date(lead.snoozedUntil) > new Date()) reasons.push("snoozed until date");
        if (selectedTemplateKey !== "SNAIL_MAIL_LETTER" && !lead.email) reasons.push("no email");
        if (selectedTemplateKey === "SNAIL_MAIL_LETTER" && !lead.address && !lead.postcode) {
          reasons.push("no postal address");
        }
        if (lead.lastCampaignStep === selectedTemplateKey) reasons.push("already received this step");
        return { lead, reasons, eligible: reasons.length === 0 };
      });
  }, [leads, campaignIndustry, campaignServiceArea, selectedTemplateKey]);

  const eligibleIds = useMemo(
    () => candidates.filter((x) => x.eligible).map((x) => x.lead.id),
    [candidates],
  );
  const selectedEligibleIds = useMemo(
    () => selectedLeadIds.filter((id) => eligibleIds.includes(id)),
    [selectedLeadIds, eligibleIds],
  );

  async function loadAll() {
    setLoading(true);
    setError(null);
    const [leadResult, campaignResult, templateResult, providerResult] = await Promise.all([
      listBackendSalesLeads(),
      listBackendSalesCampaigns(),
      listBackendSalesCampaignTemplates(),
      listBackendSalesProviderPricing(),
    ]);
    if (!leadResult.ok) setError(leadResult.error);
    else {
      setLeads(leadResult.leads);
      if (!selectedLeadId && leadResult.leads.length > 0) setSelectedLeadId(leadResult.leads[0].id);
      if (selectedLeadId && !leadResult.leads.some((lead) => lead.id === selectedLeadId) && leadResult.leads.length > 0) {
        setSelectedLeadId(leadResult.leads[0].id);
      }
    }
    if (campaignResult.ok) {
      setCampaigns(campaignResult.campaigns);
      if (!selectedCampaignId && campaignResult.campaigns.length > 0) {
        setSelectedCampaignId(campaignResult.campaigns[0].id);
      }
    }
    if (templateResult.ok) setTemplates(templateResult.templates);
    if (providerResult.ok) setProviders(providerResult.providers);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addLead() {
    setError(null);
    setMessage(null);
    const result = await createBackendSalesLead({
      businessName: form.businessName,
      industrySlug: form.industrySlug || undefined,
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      postcode: form.postcode || undefined,
      cityTown: form.cityTown || undefined,
      address: form.address || undefined,
      location: form.address || undefined,
      currentProvider: form.currentProvider || undefined,
      estimatedCurrentMonthlyCost: form.estimatedCurrentMonthlyCost
        ? Number(form.estimatedCurrentMonthlyCost)
        : undefined,
      marketingStatus: form.marketingStatus,
      status: "NEW",
      source: "manual",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm({
      businessName: "",
      industrySlug: "",
      contactName: "",
      email: "",
      phone: "",
      postcode: "",
      cityTown: "",
      address: "",
      currentProvider: "",
      estimatedCurrentMonthlyCost: "",
      estimatedCostAutoFilled: false,
      marketingStatus: "ACTIVE",
    });
    setMessage("Lead added.");
    await loadAll();
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    const text = await file.text();
    const rows = parseCsvRows(text);
    let imported = 0;
    let failed = 0;
    for (const row of rows) {
      const provider = row.currentProvider;
      const providerRow = providers.find(
        (item) =>
          item.active &&
          (item.providerKey.toLowerCase() === provider?.trim().toLowerCase() ||
            item.providerName.toLowerCase() === provider?.trim().toLowerCase()),
      );
      const estimate =
        row.estimatedCurrentMonthlyCost || !provider
          ? row.estimatedCurrentMonthlyCost
          : providerRow?.estimatedMonthlyGbp
            ? String(providerRow.estimatedMonthlyGbp)
            : "";
      const result = await createBackendSalesLead({
        businessName: row.businessName,
        country: row.country || undefined,
        cityTown: row.cityTown || undefined,
        postcode: row.postcode || undefined,
        address: row.address || undefined,
        location: row.address || undefined,
        industrySlug: row.industrySlug || undefined,
        contactName: row.contactName || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
        leadSource: row.leadSource || undefined,
        sourceUrl: row.sourceUrl || undefined,
        currentProvider: provider || providerRow?.providerName || undefined,
        estimatedCurrentMonthlyCost: estimate ? Number(estimate) : undefined,
        notes: row.notes || undefined,
        marketingStatus: "ACTIVE",
        status: "NEW",
        source: "csv",
      });
      if (result.ok) imported += 1;
      else failed += 1;
    }
    setMessage(`CSV import complete. Imported ${imported}. Failed ${failed}.`);
    await loadAll();
    event.target.value = "";
  }

  async function saveTemplate() {
    if (!selectedTemplate) return;
    const result = await saveBackendSalesCampaignTemplate({
      templateKey: selectedTemplate.templateKey,
      channel: selectedTemplate.channel,
      subject: selectedTemplate.subject ?? null,
      body: selectedTemplate.body,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Template saved.");
    await loadAll();
  }

  async function getOrCreateCampaign() {
    if (selectedCampaign) return selectedCampaign;
    const result = await createBackendSalesCampaign({
      name: `${campaignLevelLabel(campaignLevel)} - ${campaignIndustry}`,
      industrySlug: campaignIndustry,
      serviceArea: campaignServiceArea || undefined,
      campaignLevel,
      status: "DRAFT",
    });
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    await loadAll();
    setSelectedCampaignId(result.campaign.id);
    return result.campaign;
  }

  async function markPrepared() {
    const campaign = await getOrCreateCampaign();
    if (!campaign) return;
    const result = await markBackendSalesCampaignPrepared(campaign.id, selectedEligibleIds);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Campaign prepared for ${selectedEligibleIds.length} selected lead(s).`);
    await loadAll();
  }

  async function markSent() {
    const campaign = await getOrCreateCampaign();
    if (!campaign) return;
    const result = await markBackendSalesCampaignSentManual(
      campaign.id,
      selectedEligibleIds,
      selectedTemplateKey,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Marked ${selectedEligibleIds.length} selected lead(s) as sent.`);
    await loadAll();
  }

  async function snoozeThreeMonths() {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    let count = 0;
    for (const id of selectedEligibleIds) {
      const result = await updateBackendSalesLead(id, {
        marketingStatus: "DO_NOT_CONTACT",
        doNotContactReason: "No response after campaign sequence.",
        snoozedUntil: date.toISOString(),
      });
      if (result.ok) count += 1;
    }
    setMessage(`Applied do-not-contact for 3 months to ${count} selected lead(s).`);
    await loadAll();
  }

  async function saveProviderRow(row: SalesProviderPricingDto) {
    const result = await saveBackendSalesProviderPricing({
      id: row.id,
      providerName: row.providerName,
      estimatedMonthlyGbp: row.estimatedMonthlyGbp ? Number(row.estimatedMonthlyGbp) : null,
      notes: row.notes ?? null,
      active: row.active,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Provider pricing updated.");
    await loadAll();
  }

  async function addProviderRow() {
    const result = await saveBackendSalesProviderPricing({
      providerKey: providerForm.providerKey,
      providerName: providerForm.providerName,
      estimatedMonthlyGbp: providerForm.estimatedMonthlyGbp ? Number(providerForm.estimatedMonthlyGbp) : null,
      notes: providerForm.notes || null,
      active: providerForm.active,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setProviderForm({ providerKey: "", providerName: "", estimatedMonthlyGbp: "", notes: "", active: true });
    setMessage("Provider pricing row added.");
    await loadAll();
  }

  const preview = selectedTemplate ? renderTemplate(selectedTemplate, selectedLead, campaignIndustry) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Build leads, select candidates, edit templates, and track manual sends.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
      </div>
      <AdminPillNav />

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void loadAll()}>
          {loading ? "Loading..." : "Reload"}
        </button>
        <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={downloadLeadsCsvTemplate}>
          Download leads CSV template
        </button>
        <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
          Import CSV
          <input type="file" className="hidden" accept=".csv,text/csv" onChange={(e) => void importCsv(e)} />
        </label>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add lead</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Business name *" value={form.businessName} onChange={(e) => setForm((c) => ({ ...c, businessName: e.target.value }))} />
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={form.industrySlug} onChange={(e) => setForm((c) => ({ ...c, industrySlug: e.target.value }))}>
            <option value="">Industry</option>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
          </select>
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Contact name" value={form.contactName} onChange={(e) => setForm((c) => ({ ...c, contactName: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Postcode" value={form.postcode} onChange={(e) => setForm((c) => ({ ...c, postcode: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="City/town" value={form.cityTown} onChange={(e) => setForm((c) => ({ ...c, cityTown: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Address" value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={form.currentProvider} onChange={(e) => {
            const provider = e.target.value;
            const providerRow = providers.find((item) => item.providerName === provider || item.providerKey === provider.toLowerCase());
            const estimate = providerRow?.estimatedMonthlyGbp ? Number(providerRow.estimatedMonthlyGbp) : null;
            setForm((c) => ({
              ...c,
              currentProvider: provider,
              estimatedCurrentMonthlyCost:
                !c.estimatedCurrentMonthlyCost || c.estimatedCostAutoFilled
                  ? estimate === null
                    ? ""
                    : String(estimate)
                  : c.estimatedCurrentMonthlyCost,
              estimatedCostAutoFilled: estimate !== null,
            }));
          }}>
            <option value="">Current provider</option>
            {providers.filter((item) => item.active).map((provider) => (
              <option key={provider.id} value={provider.providerName}>{provider.providerName}</option>
            ))}
          </select>
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Estimated current monthly cost (£)" value={form.estimatedCurrentMonthlyCost} onChange={(e) => setForm((c) => ({ ...c, estimatedCurrentMonthlyCost: e.target.value, estimatedCostAutoFilled: false }))} />
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={form.marketingStatus} onChange={(e) => setForm((c) => ({ ...c, marketingStatus: e.target.value }))}>
            {MARKETING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-600">Auto-filled from provider pricing table - edit if known.</p>
        <button className={`mt-2 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void addLead()}>
          Add lead
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Template editor</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATE_KEYS.map((item) => (
            <button key={item.key} className={`${selectedTemplateKey === item.key ? primaryButtonClass : outlineButtonClass} ${smallButtonClass}`} onClick={() => setSelectedTemplateKey(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        {selectedTemplate ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <input className="w-full rounded border border-slate-300 px-2 py-2 text-sm" value={selectedTemplate.subject ?? ""} disabled={selectedTemplate.channel !== "EMAIL"} onChange={(e) => setTemplates((current) => current.map((t) => t.templateKey === selectedTemplate.templateKey ? { ...t, subject: e.target.value } : t))} />
              <textarea className="mt-2 min-h-44 w-full rounded border border-slate-300 px-2 py-2 text-sm" value={selectedTemplate.body} onChange={(e) => setTemplates((current) => current.map((t) => t.templateKey === selectedTemplate.templateKey ? { ...t, body: e.target.value } : t))} />
              <button className={`mt-2 ${primaryButtonClass} ${smallButtonClass}`} onClick={() => void saveTemplate()}>Save template</button>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold">Rendered preview</p>
              {preview ? (
                <>
                  {selectedTemplate.channel === "EMAIL" ? <p className="mt-2"><span className="font-semibold">Subject:</span> {preview.subject}</p> : null}
                  <pre className="mt-2 whitespace-pre-wrap">{preview.body}</pre>
                </>
              ) : (
                <p className="mt-2 text-slate-600">Select a lead for personalized preview.</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Campaign builder + candidate selection</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={campaignIndustry} onChange={(e) => setCampaignIndustry(e.target.value)}>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
          </select>
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Service area filter (optional)" value={campaignServiceArea} onChange={(e) => setCampaignServiceArea(e.target.value)} />
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={campaignLevel} onChange={(e) => { const level = e.target.value as CampaignLevel; setCampaignLevel(level); setSelectedTemplateKey(defaultTemplateKeyForLevel(level)); }}>
            <option value="LAUNCH_OFFER">Launch offer</option>
            <option value="INTRODUCTION">Introduction</option>
            <option value="REMINDER">Reminder</option>
          </select>
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}>
            <option value="">Create/use latest campaign</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSelectedLeadIds(eligibleIds)}>Select all eligible</button>
          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSelectedLeadIds([])}>Clear</button>
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void markPrepared()} disabled={selectedEligibleIds.length === 0}>Mark campaign prepared</button>
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void markSent()} disabled={selectedEligibleIds.length === 0}>Mark selected as sent manually</button>
          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void snoozeThreeMonths()} disabled={selectedEligibleIds.length === 0}>Do not contact 3 months</button>
        </div>
        <p className="mt-2 text-sm text-slate-700">Eligible: {eligibleIds.length} / {candidates.length}</p>

        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-2 py-2">Select</th>
                <th className="px-2 py-2">Business</th>
                <th className="px-2 py-2">Contact</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Postcode/location</th>
                <th className="px-2 py-2">Industry</th>
                <th className="px-2 py-2">Provider</th>
                <th className="px-2 py-2">Est £/month</th>
                <th className="px-2 py-2">Marketing status</th>
                <th className="px-2 py-2">Last contacted</th>
                <th className="px-2 py-2">Last step</th>
                <th className="px-2 py-2">Eligibility</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((row) => (
                <tr key={row.lead.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      disabled={!row.eligible}
                      checked={selectedLeadIds.includes(row.lead.id)}
                      onChange={(e) =>
                        setSelectedLeadIds((current) =>
                          e.target.checked ? [...current, row.lead.id] : current.filter((id) => id !== row.lead.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2"><button className="underline" onClick={() => setSelectedLeadId(row.lead.id)}>{row.lead.businessName}</button></td>
                  <td className="px-2 py-2">{row.lead.contactName ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.email ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.phone ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.postcode ?? "-"} / {row.lead.cityTown ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.industrySlug ? formatIndustryLabel(row.lead.industrySlug) : "-"}</td>
                  <td className="px-2 py-2">{row.lead.currentProvider ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.estimatedCurrentMonthlyCost ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.marketingStatus ?? "ACTIVE"}</td>
                  <td className="px-2 py-2">{row.lead.lastContactedAt ? formatUkDateTime(row.lead.lastContactedAt) : "-"}</td>
                  <td className="px-2 py-2">{row.lead.lastCampaignStep ?? "-"}</td>
                  <td className="px-2 py-2">{row.eligible ? "Eligible" : row.reasons.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Provider pricing table</h2>
        <p className="text-sm text-slate-600">Used for lead estimated monthly cost auto-fill. Booksy default is £40.</p>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-2 py-2">Provider</th>
                <th className="px-2 py-2">Key</th>
                <th className="px-2 py-2">Estimated £/month</th>
                <th className="px-2 py-2">Active</th>
                <th className="px-2 py-2">Notes</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-2 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      value={row.providerName}
                      onChange={(e) =>
                        setProviders((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, providerName: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">{row.providerKey}</td>
                  <td className="px-2 py-2">
                    <input
                      className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
                      value={row.estimatedMonthlyGbp ?? ""}
                      onChange={(e) =>
                        setProviders((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, estimatedMonthlyGbp: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={row.active}
                        onChange={(e) =>
                          setProviders((current) =>
                            current.map((item) =>
                              item.id === row.id ? { ...item, active: e.target.checked } : item,
                            ),
                          )
                        }
                      />
                      <span>{row.active ? "Yes" : "No"}</span>
                    </label>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      value={row.notes ?? ""}
                      onChange={(e) =>
                        setProviders((current) =>
                          current.map((item) =>
                            item.id === row.id ? { ...item, notes: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void saveProviderRow(row)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="provider key" value={providerForm.providerKey} onChange={(e) => setProviderForm((c) => ({ ...c, providerKey: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="provider name" value={providerForm.providerName} onChange={(e) => setProviderForm((c) => ({ ...c, providerName: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="estimated monthly £" value={providerForm.estimatedMonthlyGbp} onChange={(e) => setProviderForm((c) => ({ ...c, estimatedMonthlyGbp: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="notes" value={providerForm.notes} onChange={(e) => setProviderForm((c) => ({ ...c, notes: e.target.value }))} />
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void addProviderRow()}>Add provider</button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Suppression and unsubscribe</h2>
        <p className="text-sm text-slate-700">
          Unsubscribed, converted/subscribed, bounced, and do-not-contact leads are excluded from future campaigns.
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Live bulk sending remains disabled; Resend webhook still requires verified signature handling before automated
          bounce/event ingestion.
        </p>
      </section>
    </main>
  );
}
