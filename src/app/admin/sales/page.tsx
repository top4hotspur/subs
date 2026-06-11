"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { buildSalesCampaignEmailHtml, buildSalesCampaignPlainText } from "@/lib/sales/sales-campaign-email-render";
import {
  createBackendSalesLead,
  deleteBackendSalesLead,
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
  sendBackendSalesCampaignEmail,
  saveBackendSalesCampaignTemplate,
} from "@/lib/sales/admin-sales-campaign-client";
import {
  listBackendSalesProviderPricing,
  saveBackendSalesProviderPricing,
  SalesProviderPricingDto,
} from "@/lib/sales/admin-sales-provider-pricing-client";
import {
  approveBackendSalesLeadImportRows,
  createBackendSalesLeadImportBatch,
  listBackendSalesLeadImportBatches,
  markBackendSalesLeadImportRowForEmailResearch,
  SalesLeadImportBatchDto,
  SalesLeadImportRowDto,
  updateBackendSalesLeadImportRow,
} from "@/lib/sales/admin-sales-lead-import-client";
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
const IMPORT_SOURCE_TYPES = ["Booksy", "Google Maps", "Facebook", "Manual", "Other"];
const IMPORT_EMAIL_STATUSES = ["Missing email", "Website found", "Email found", "Needs manual research", "Do not contact"];
const IMPORT_ROW_STATUSES = ["PENDING_REVIEW", "NEEDS_ENRICHMENT", "DUPLICATE", "SKIPPED"];

const LEADS_CSV_TEMPLATE_HEADERS = [
  "businessName",
  "country",
  "cityTown",
  "postcode",
  "address",
  "industrySlug",
  "contactFirstName",
  "contactLastName",
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
  "Steven",
  "Glass",
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

function formatIndustryBusinessType(slug: string): string {
  const label = formatIndustryLabel(slug).toLowerCase();
  if (label.endsWith("ers")) return label.slice(0, -1);
  if (label.endsWith("s")) return label.slice(0, -1);
  return label;
}

function splitContactName(contactName?: string | null): { firstName?: string; lastName?: string } {
  const trimmed = contactName?.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function buildContactDisplay(lead: SalesLeadDto): string {
  const first = lead.contactFirstName?.trim();
  const last = lead.contactLastName?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return lead.contactName?.trim() || "-";
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
  const fallbackNameParts = splitContactName(lead?.contactName);
  const contactFirstNameBase = lead?.contactFirstName?.trim() || fallbackNameParts.firstName || "";
  const contactLastName = lead?.contactLastName?.trim() || fallbackNameParts.lastName || "";
  const contactName = [contactFirstNameBase, contactLastName].filter(Boolean).join(" ") || lead?.contactName?.trim() || "";
  const contactFirstName = contactFirstNameBase || contactName || "";
  const safeIndustry = industry || lead?.industrySlug || "barbers";
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const origin = baseUrl || fallbackOrigin;
  const landingPageLink = `${origin}/${safeIndustry}`;
  const demoLink = `${origin}/demo/${safeIndustry}`;
  const values: Record<string, string> = {
    businessName: lead?.businessName ?? "your business",
    contactFirstName,
    contactLastName,
    contactName,
    industry: formatIndustryLabel(safeIndustry),
    industryLabel: formatIndustryLabel(safeIndustry),
    industryBusinessType: formatIndustryBusinessType(safeIndustry),
    currentProvider: lead?.currentProvider ?? "current provider",
    estimatedCurrentMonthlyCost: String(lead?.estimatedCurrentMonthlyCost ?? "unknown"),
    landingPageLink,
    demoLink,
    unsubscribeLink: "/unsubscribe/sales?token=<token>",
  };
  let subject = template.subject ?? "";
  let body = template.body;
  for (const [k, v] of Object.entries(values)) {
    subject = subject.replaceAll(`{{${k}}}`, v);
    body = body.replaceAll(`{{${k}}}`, v);
  }
  body = body.replaceAll("Hi ,", "Hi,");
  const plainText = buildSalesCampaignPlainText(body, {
    landingPageLink,
    demoLink,
    unsubscribeLink: values.unsubscribeLink,
  });
  const html = buildSalesCampaignEmailHtml(subject, plainText, {
    landingPageLink,
    demoLink,
    unsubscribeLink: values.unsubscribeLink,
    siteUrl: origin,
  });
  return { subject, body, plainText, html };
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

function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildEmailResearchUrl(lead: SalesLeadDto): string {
  const businessName = lead.businessName.trim();
  const cityTown = lead.cityTown?.trim();
  const postcode = lead.postcode?.trim();
  const emailTerms = `email OR "contact email"`;
  const query = cityTown
    ? `"${businessName}" "${cityTown}" ${emailTerms}`
    : postcode
      ? `"${businessName}" "${postcode}" ${emailTerms}`
      : `"${businessName}" ${emailTerms}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildImportEmailResearchUrl(row: SalesLeadImportRowDto): string {
  const businessName = row.extractedBusinessName?.trim();
  if (!businessName) return "https://www.google.com/search?q=business%20contact%20email";
  const cityTown = row.cityTown?.trim();
  const postcode = row.extractedPostcode?.trim();
  const emailTerms = `email OR "contact email"`;
  const query = cityTown
    ? `"${businessName}" "${cityTown}" ${emailTerms}`
    : postcode
      ? `"${businessName}" "${postcode}" ${emailTerms}`
      : `"${businessName}" ${emailTerms}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function emailResearchStatus(lead: SalesLeadDto): string {
  if (lead.marketingStatus === "DO_NOT_CONTACT" || lead.marketingStatus === "UNSUBSCRIBED") return "Do not contact";
  return lead.email ? "Email added manually" : "Email missing";
}

function buildImportPreviewMessage(batch: SalesLeadImportBatchDto): string {
  const extractedCounts = batch.rows
    .map((row) => (typeof row.raw?.extractedCount === "number" ? row.raw.extractedCount : 0))
    .filter((count) => count > 0);
  const sponsoredSkippedCount = batch.rows.reduce(
    (total, row) => total + (typeof row.raw?.sponsoredSkippedCount === "number" ? row.raw.sponsoredSkippedCount : 0),
    0,
  );
  const fallbackReason = batch.rows.find((row) => row.raw?.fallbackReason)?.raw?.fallbackReason;
  if (extractedCounts.length > 0) {
    const extractedCount = Math.max(...extractedCounts);
    return `Extracted ${extractedCount} visible Booksy listings.${sponsoredSkippedCount > 0 ? ` Skipped ${sponsoredSkippedCount} sponsored listings.` : ""}`;
  }
  if (fallbackReason) {
    return "Could not extract visible listings from this URL. A placeholder row has been created for manual review.";
  }
  return `Import preview created with ${batch.rows.length} row(s).`;
}

export default function AdminSalesPage() {
  const [leads, setLeads] = useState<SalesLeadDto[]>([]);
  const [campaigns, setCampaigns] = useState<SalesCampaignDto[]>([]);
  const [templates, setTemplates] = useState<SalesCampaignTemplateDto[]>([]);
  const [providers, setProviders] = useState<SalesProviderPricingDto[]>([]);
  const [importBatches, setImportBatches] = useState<SalesLeadImportBatchDto[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedImportRowIds, setSelectedImportRowIds] = useState<string[]>([]);
  const [leadEmailEdits, setLeadEmailEdits] = useState<Record<string, string>>({});
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TemplateKey>("EMAIL_INTRODUCTION");
  const [campaignLevel, setCampaignLevel] = useState<CampaignLevel>("INTRODUCTION");
  const [campaignIndustry, setCampaignIndustry] = useState("barbers");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    industrySlug: "",
    contactFirstName: "",
    contactLastName: "",
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
  const [importForm, setImportForm] = useState({
    sourceUrls: "",
    sourceType: "Booksy",
    defaultIndustrySlug: "",
    defaultCityTown: "",
    approveDuplicates: false,
  });
  const [letterQrDataUrl, setLetterQrDataUrl] = useState<string | null>(null);

  const selectedLead = useMemo(() => leads.find((x) => x.id === selectedLeadId) ?? null, [leads, selectedLeadId]);
  const selectedCampaign = useMemo(
    () => campaigns.find((x) => x.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((x) => x.templateKey === selectedTemplateKey) ?? null,
    [templates, selectedTemplateKey],
  );
  const activeImportBatch = importBatches[0] ?? null;
  const preview = useMemo(
    () => (selectedTemplate ? renderTemplate(selectedTemplate, selectedLead, campaignIndustry) : null),
    [selectedTemplate, selectedLead, campaignIndustry],
  );

  const candidates = useMemo(() => {
    return leads
      .filter((lead) => !campaignIndustry || lead.industrySlug === campaignIndustry)
      .map((lead) => {
        const reasons: string[] = [];
        if (["UNSUBSCRIBED", "DO_NOT_CONTACT", "BOUNCED", "CONVERTED"].includes(lead.marketingStatus ?? "ACTIVE")) {
          reasons.push(`suppressed (${lead.marketingStatus})`);
        }
        if (lead.snoozedUntil && new Date(lead.snoozedUntil) > new Date()) reasons.push("snoozed until date");
        if (selectedTemplateKey !== "SNAIL_MAIL_LETTER" && !lead.email) reasons.push("no email");
        if (selectedTemplateKey !== "SNAIL_MAIL_LETTER" && lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
          reasons.push("invalid email");
        }
        if (selectedTemplateKey === "SNAIL_MAIL_LETTER" && !lead.address && !lead.postcode) {
          reasons.push("no postal address");
        }
        if (lead.lastCampaignStep === selectedTemplateKey) reasons.push("already received this step");
        return { lead, reasons, eligible: reasons.length === 0 };
      });
  }, [leads, campaignIndustry, selectedTemplateKey]);

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
    const [leadResult, campaignResult, templateResult, providerResult, importResult] = await Promise.all([
      listBackendSalesLeads(),
      listBackendSalesCampaigns(),
      listBackendSalesCampaignTemplates(),
      listBackendSalesProviderPricing(),
      listBackendSalesLeadImportBatches(),
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
    if (importResult.ok) setImportBatches(importResult.batches);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function generateQr() {
      if (!selectedTemplate || selectedTemplate.templateKey !== "SNAIL_MAIL_LETTER" || !preview?.body) {
        setLetterQrDataUrl(null);
        return;
      }
      const landingMatch = preview.body.match(/https?:\/\/[^\s]+/);
      const targetUrl = landingMatch?.[0];
      if (!targetUrl) {
        setLetterQrDataUrl(null);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(targetUrl, { margin: 1, width: 180 });
        setLetterQrDataUrl(dataUrl);
      } catch {
        setLetterQrDataUrl(null);
      }
    }
    void generateQr();
  }, [selectedTemplate, preview?.body]);

  async function addLead() {
    setError(null);
    setMessage(null);
    if (!form.industrySlug) {
      setError("Please select an industry.");
      return;
    }
    const result = await createBackendSalesLead({
      businessName: form.businessName,
      industrySlug: form.industrySlug || undefined,
      contactName: [form.contactFirstName, form.contactLastName].filter(Boolean).join(" ") || undefined,
      contactFirstName: form.contactFirstName || undefined,
      contactLastName: form.contactLastName || undefined,
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
      if (result.error === "VALIDATION_ERROR") {
        setError("Please check the lead details and try again.");
      } else {
        setError(result.error);
      }
      return;
    }
    setForm({
      businessName: "",
      industrySlug: "",
      contactFirstName: "",
      contactLastName: "",
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
      const fallbackNameParts = splitContactName(row.contactName);
      const result = await createBackendSalesLead({
        businessName: row.businessName,
        country: row.country || undefined,
        cityTown: row.cityTown || undefined,
        postcode: row.postcode || undefined,
        address: row.address || undefined,
        location: row.address || undefined,
        industrySlug: row.industrySlug || undefined,
        contactName: row.contactName || undefined,
        contactFirstName: row.contactFirstName || fallbackNameParts.firstName || undefined,
        contactLastName: row.contactLastName || fallbackNameParts.lastName || undefined,
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

  async function sendSelectedEmail() {
    const campaign = await getOrCreateCampaign();
    if (!campaign) return;
    const selectedCount = selectedEligibleIds.length;
    if (selectedCount === 0) {
      setError("Select at least one eligible lead.");
      return;
    }
    const ineligibleSelectedCount = selectedLeadIds.length - selectedEligibleIds.length;
    const templateLabel = TEMPLATE_KEYS.find((item) => item.key === selectedTemplateKey)?.label || selectedTemplateKey;
    const confirmed = window.confirm(
      `Send ${templateLabel} to ${selectedCount} selected lead(s)? This will email selected contacts and update campaign history.${ineligibleSelectedCount > 0 ? `\n\n${ineligibleSelectedCount} selected lead(s) are ineligible and will be skipped.` : ""}`,
    );
    if (!confirmed) return;
    const result = await sendBackendSalesCampaignEmail(campaign.id, selectedEligibleIds, selectedTemplateKey);
    if (!result.ok) {
      if (result.error === "EMAIL_NOT_CONFIGURED") {
        setError("Email provider is not configured. Use manual sent tracking or configure email first.");
      } else {
        setError(result.error);
      }
      return;
    }
    const skippedReasons = result.result.details
      .filter((item) => item.outcome !== "SENT" && item.reason)
      .map((item) => item.reason)
      .slice(0, 3)
      .join(", ");
    setMessage(
      `Sent ${result.result.sentCount}. Skipped ${result.result.skippedCount}. Failed ${result.result.failedCount}.${skippedReasons ? ` Reasons: ${skippedReasons}` : ""}`,
    );
    await loadAll();
  }

  async function deleteLead(leadId: string) {
    const confirmed = window.confirm("Delete this lead? This is intended for test/spam leads and cannot be undone.");
    if (!confirmed) return;
    let result = await deleteBackendSalesLead(leadId, false);
    if (!result.ok && result.error === "FORCE_CONFIRMATION_REQUIRED") {
      const forceConfirmed = window.confirm(
        "This lead has campaign history or converted status. Delete permanently anyway?",
      );
      if (!forceConfirmed) return;
      result = await deleteBackendSalesLead(leadId, true);
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Lead deleted.");
    await loadAll();
  }

  async function deleteSelectedLeads() {
    if (selectedLeadIds.length === 0) {
      setError("Select at least one lead to delete.");
      return;
    }
    const confirmed = window.confirm(
      `Delete ${selectedLeadIds.length} selected lead(s)? This is intended for test/spam leads and cannot be undone.`,
    );
    if (!confirmed) return;
    let deleted = 0;
    let failed = 0;
    for (const id of selectedLeadIds) {
      const result = await deleteBackendSalesLead(id, false);
      if (result.ok) {
        deleted += 1;
        continue;
      }
      if (result.error === "FORCE_CONFIRMATION_REQUIRED") {
        const force = window.confirm(
          "Some selected leads have campaign history or converted status. Force delete those leads as well?",
        );
        if (force) {
          const forced = await deleteBackendSalesLead(id, true);
          if (forced.ok) deleted += 1;
          else failed += 1;
        } else {
          failed += 1;
        }
      } else {
        failed += 1;
      }
    }
    setMessage(`Deleted ${deleted} selected lead(s). Failed ${failed}.`);
    setSelectedLeadIds([]);
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

  async function saveLeadEmail(lead: SalesLeadDto) {
    setError(null);
    setMessage(null);
    const normalizedEmail = normalizeEmailInput(leadEmailEdits[lead.id] ?? lead.email ?? "");
    if (!normalizedEmail) {
      setError("Enter an email address before saving.");
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    const result = await updateBackendSalesLead(lead.id, { email: normalizedEmail });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLeads((current) => current.map((item) => (item.id === lead.id ? result.lead : item)));
    setLeadEmailEdits((current) => ({ ...current, [lead.id]: normalizedEmail }));
    setMessage("Lead email saved.");
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

  function replaceImportRow(row: SalesLeadImportRowDto) {
    setImportBatches((current) =>
      current.map((batch) =>
        batch.id === row.batchId
          ? { ...batch, rows: batch.rows.map((item) => (item.id === row.id ? row : item)) }
          : batch,
      ),
    );
  }

  async function createImportPreview() {
    setError(null);
    setMessage(null);
    const sourceUrls = importForm.sourceUrls
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);
    if (sourceUrls.length === 0) {
      setError("Paste at least one source URL.");
      return;
    }
    const result = await createBackendSalesLeadImportBatch({
      sourceUrls,
      sourceType: importForm.sourceType || undefined,
      defaultIndustrySlug: importForm.defaultIndustrySlug || undefined,
      defaultCityTown: importForm.defaultCityTown || undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setImportBatches((current) => [result.batch, ...current.filter((batch) => batch.id !== result.batch.id)]);
    setSelectedImportRowIds(result.batch.rows.filter((row) => row.status !== "SKIPPED").map((row) => row.id));
    setMessage(buildImportPreviewMessage(result.batch));
  }

  async function saveImportRow(row: SalesLeadImportRowDto) {
    const result = await updateBackendSalesLeadImportRow(row.id, {
      extractedBusinessName: row.extractedBusinessName || null,
      extractedAddress: row.extractedAddress || null,
      extractedPostcode: row.extractedPostcode || null,
      extractedPhone: row.extractedPhone || null,
      extractedWebsite: row.extractedWebsite || null,
      extractedEmail: row.extractedEmail || null,
      leadSource: row.leadSource || null,
      currentProvider: row.currentProvider || null,
      estimatedCurrentMonthlyCost: row.estimatedCurrentMonthlyCost ? Number(row.estimatedCurrentMonthlyCost) : null,
      industrySlug: row.industrySlug || null,
      cityTown: row.cityTown || null,
      status: row.status,
      emailEnrichmentStatus: row.emailEnrichmentStatus,
      notes: row.notes || null,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceImportRow(result.row);
    setMessage("Import row saved.");
  }

  async function skipImportRow(row: SalesLeadImportRowDto) {
    const result = await updateBackendSalesLeadImportRow(row.id, { status: "SKIPPED" });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceImportRow(result.row);
    setSelectedImportRowIds((current) => current.filter((id) => id !== row.id));
    setMessage("Import row skipped.");
  }

  async function markImportRowForEmailResearch(row: SalesLeadImportRowDto) {
    const result = await markBackendSalesLeadImportRowForEmailResearch(row.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    replaceImportRow(result.row);
    setMessage("Import row marked for email research.");
  }

  async function approveImportRows() {
    if (!activeImportBatch || selectedImportRowIds.length === 0) {
      setError("Select at least one import row to approve.");
      return;
    }
    const result = await approveBackendSalesLeadImportRows(
      activeImportBatch.id,
      selectedImportRowIds,
      importForm.approveDuplicates,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.result.batch) {
      setImportBatches((current) =>
        current.map((batch) => (batch.id === result.result.batch?.id ? result.result.batch : batch)),
      );
    }
    setSelectedImportRowIds([]);
    setMessage(
      `Approved ${result.result.approvedLeadIds.length} row(s). Skipped ${result.result.skipped.length}.`,
    );
    await loadAll();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-slate-600">
            Build leads, select candidates, edit templates, and track manual sends.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sales pipeline build marker: <span className="font-mono">sales-pipeline-provider-pricing-v2</span> · Service Area removed · Booksy default £40 · provider pricing table enabled
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lead Import &amp; Enrichment</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Paste search/profile URLs and we&apos;ll prepare visible lead data for review. Missing contact details can be enriched from public business websites or marked for manual research.
            </p>
          </div>
          <label className={`${outlineButtonClass} ${smallButtonClass} cursor-pointer`}>
            Upload URL list
            <input
              type="file"
              className="hidden"
              accept=".txt,.csv,text/plain,text/csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                setImportForm((current) => ({ ...current, sourceUrls: text }));
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <textarea
            className="min-h-32 rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="One URL per line"
            value={importForm.sourceUrls}
            onChange={(event) => setImportForm((current) => ({ ...current, sourceUrls: event.target.value }))}
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              value={importForm.sourceType}
              onChange={(event) => setImportForm((current) => ({ ...current, sourceType: event.target.value }))}
            >
              {IMPORT_SOURCE_TYPES.map((sourceType) => (
                <option key={sourceType} value={sourceType}>{sourceType}</option>
              ))}
            </select>
            <select
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              value={importForm.defaultIndustrySlug}
              onChange={(event) => setImportForm((current) => ({ ...current, defaultIndustrySlug: event.target.value }))}
            >
              <option value="">Default industry</option>
              {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
            </select>
            <input
              className="rounded border border-slate-300 px-2 py-2 text-sm"
              placeholder="Default city/town"
              value={importForm.defaultCityTown}
              onChange={(event) => setImportForm((current) => ({ ...current, defaultCityTown: event.target.value }))}
            />
            <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void createImportPreview()}>
              Create import preview
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Before sending marketing emails, confirm the lead is a suitable business contact and honour unsubscribe/do-not-contact requests.
        </p>

        {activeImportBatch ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-700">
                Latest preview: {activeImportBatch.rows.length} row(s) from {activeImportBatch.sourceType ?? "mixed"}.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={importForm.approveDuplicates}
                    onChange={(event) => setImportForm((current) => ({ ...current, approveDuplicates: event.target.checked }))}
                  />
                  Approve duplicates anyway
                </label>
                <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSelectedImportRowIds(activeImportBatch.rows.filter((row) => row.status !== "APPROVED" && row.status !== "SKIPPED").map((row) => row.id))}>
                  Select reviewable
                </button>
                <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => setSelectedImportRowIds([])}>
                  Clear
                </button>
                <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void approveImportRows()} disabled={selectedImportRowIds.length === 0}>
                  Approve selected into pipeline
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-2 py-2">Select</th>
                    <th className="px-2 py-2">Business</th>
                    <th className="px-2 py-2">Source URL</th>
                    <th className="px-2 py-2">Contact</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Source/provider</th>
                    <th className="px-2 py-2">Email research</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeImportBatch.rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 align-top">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          disabled={row.status === "APPROVED" || row.status === "SKIPPED"}
                          checked={selectedImportRowIds.includes(row.id)}
                          onChange={(event) =>
                            setSelectedImportRowIds((current) =>
                              event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                            )
                          }
                        />
                      </td>
                      <td className="min-w-52 px-2 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Business name"
                          value={row.extractedBusinessName ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, extractedBusinessName: event.target.value })}
                        />
                        <input
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Website"
                          value={row.extractedWebsite ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, extractedWebsite: event.target.value })}
                        />
                        {row.duplicateReason ? <p className="mt-1 text-amber-700">Duplicate: {row.duplicateReason}</p> : null}
                      </td>
                      <td className="max-w-64 px-2 py-2 break-all text-slate-600">
                        <a className="underline" href={row.sourceUrl} target="_blank" rel="noreferrer">
                          {row.sourceUrl}
                        </a>
                      </td>
                      <td className="min-w-44 px-2 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Email"
                          value={row.extractedEmail ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, extractedEmail: event.target.value, emailEnrichmentStatus: event.target.value ? "Email found" : row.emailEnrichmentStatus })}
                        />
                        <input
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Phone"
                          value={row.extractedPhone ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, extractedPhone: event.target.value })}
                        />
                        <a
                          className={`mt-1 inline-flex ${outlineButtonClass} ${smallButtonClass}`}
                          href={buildImportEmailResearchUrl(row)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Find email
                        </a>
                      </td>
                      <td className="min-w-48 px-2 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Address"
                          value={row.extractedAddress ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, extractedAddress: event.target.value })}
                        />
                        <div className="mt-1 grid grid-cols-2 gap-1">
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Postcode"
                            value={row.extractedPostcode ?? ""}
                            onChange={(event) => replaceImportRow({ ...row, extractedPostcode: event.target.value })}
                          />
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="City/town"
                            value={row.cityTown ?? ""}
                            onChange={(event) => replaceImportRow({ ...row, cityTown: event.target.value })}
                          />
                        </div>
                        <select
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          value={row.industrySlug ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, industrySlug: event.target.value })}
                        >
                          <option value="">Industry</option>
                          {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
                        </select>
                      </td>
                      <td className="min-w-44 px-2 py-2">
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Lead source"
                          value={row.leadSource ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, leadSource: event.target.value })}
                        />
                        <input
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Current provider"
                          value={row.currentProvider ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, currentProvider: event.target.value })}
                        />
                        <input
                          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Est monthly cost"
                          value={row.estimatedCurrentMonthlyCost ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, estimatedCurrentMonthlyCost: event.target.value })}
                        />
                      </td>
                      <td className="min-w-44 px-2 py-2">
                        <select
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          value={row.emailEnrichmentStatus}
                          onChange={(event) => replaceImportRow({ ...row, emailEnrichmentStatus: event.target.value })}
                        >
                          {IMPORT_EMAIL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <textarea
                          className="mt-1 min-h-14 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          placeholder="Notes"
                          value={row.notes ?? ""}
                          onChange={(event) => replaceImportRow({ ...row, notes: event.target.value })}
                        />
                      </td>
                      <td className="min-w-36 px-2 py-2">
                        {row.status === "APPROVED" ? (
                          <span className="font-semibold text-emerald-700">APPROVED</span>
                        ) : (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                            value={row.status}
                            onChange={(event) => replaceImportRow({ ...row, status: event.target.value })}
                          >
                            {IMPORT_ROW_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="min-w-32 px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void saveImportRow(row)} disabled={row.status === "APPROVED"}>
                            Save
                          </button>
                          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void markImportRowForEmailResearch(row)} disabled={row.status === "APPROVED"}>
                            Mark for email research
                          </button>
                          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void skipImportRow(row)} disabled={row.status === "APPROVED" || row.status === "SKIPPED"}>
                            Skip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add lead</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Business name *" value={form.businessName} onChange={(e) => setForm((c) => ({ ...c, businessName: e.target.value }))} />
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={form.industrySlug} onChange={(e) => setForm((c) => ({ ...c, industrySlug: e.target.value }))}>
            <option value="">Industry</option>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
          </select>
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="First name" value={form.contactFirstName} onChange={(e) => setForm((c) => ({ ...c, contactFirstName: e.target.value }))} />
          <input className="rounded border border-slate-300 px-2 py-2 text-sm" placeholder="Last name" value={form.contactLastName} onChange={(e) => setForm((c) => ({ ...c, contactLastName: e.target.value }))} />
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
              <p className="mt-1 text-xs text-slate-600">Live bulk sending remains disabled in this phase.</p>
              <div className="mt-2 rounded border border-slate-200 bg-white p-2 text-xs">
                <p className="font-semibold">Available tokens</p>
                <p>{"{{contactFirstName}}, {{contactLastName}}, {{contactName}}, {{businessName}}, {{industry}}, {{industryLabel}}, {{industryBusinessType}}, {{currentProvider}}, {{estimatedCurrentMonthlyCost}}, {{landingPageLink}}, {{demoLink}}, {{unsubscribeLink}}"}</p>
              </div>
              {preview ? (
                <>
                  {selectedTemplate.channel === "EMAIL" ? (
                    <>
                      <p className="mt-2">
                        <span className="font-semibold">Subject:</span> {preview.subject}
                      </p>
                      <div className="mt-2 rounded border border-slate-200 bg-white p-2">
                        <p className="mb-2 text-xs font-semibold text-slate-700">HTML preview</p>
                        <div
                          className="overflow-hidden rounded border border-slate-200"
                          dangerouslySetInnerHTML={{ __html: preview.html }}
                        />
                      </div>
                      <div className="mt-2 rounded border border-slate-200 bg-white p-2">
                        <p className="mb-2 text-xs font-semibold text-slate-700">Plain-text fallback</p>
                        <pre className="whitespace-pre-wrap text-xs">{preview.plainText}</pre>
                      </div>
                    </>
                  ) : (
                    <pre className="mt-2 whitespace-pre-wrap">{preview.body}</pre>
                  )}
                  {selectedTemplate.templateKey === "SNAIL_MAIL_LETTER" && letterQrDataUrl ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold">QR code preview (landing page)</p>
                      <img src={letterQrDataUrl} alt="Landing page QR code" className="mt-1 h-28 w-28 rounded border border-slate-300" />
                    </div>
                  ) : null}
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
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <select className="rounded border border-slate-300 px-2 py-2 text-sm" value={campaignIndustry} onChange={(e) => setCampaignIndustry(e.target.value)}>
            {WEBSITE_TEMPLATE_SLUGS.map((slug) => <option key={slug} value={slug}>{formatIndustryLabel(slug)}</option>)}
          </select>
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
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void sendSelectedEmail()} disabled={selectedEligibleIds.length === 0}>Send selected email</button>
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void markPrepared()} disabled={selectedEligibleIds.length === 0}>Mark campaign prepared</button>
          <button className={`${primaryButtonClass} ${smallButtonClass}`} onClick={() => void markSent()} disabled={selectedEligibleIds.length === 0}>Mark selected as sent manually</button>
          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void snoozeThreeMonths()} disabled={selectedEligibleIds.length === 0}>Do not contact 3 months</button>
          <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void deleteSelectedLeads()} disabled={selectedLeadIds.length === 0}>Delete selected test leads</button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Send selected email sends via configured provider to selected eligible leads only. Mark selected as sent manually logs external/manual sends without dispatching email.
        </p>
        <p className="mt-2 text-sm text-slate-700">Eligible: {eligibleIds.length} / {candidates.length}</p>

        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-2 py-2">Select</th>
                <th className="px-2 py-2">Business</th>
                <th className="px-2 py-2">Contact</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Email research</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Postcode/location</th>
                <th className="px-2 py-2">Industry</th>
                <th className="px-2 py-2">Provider</th>
                <th className="px-2 py-2">Est £/month</th>
                <th className="px-2 py-2">Marketing status</th>
                <th className="px-2 py-2">Last contacted</th>
                <th className="px-2 py-2">Last step</th>
                <th className="px-2 py-2">Eligibility</th>
                <th className="px-2 py-2">Delete</th>
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
                  <td className="px-2 py-2">{buildContactDisplay(row.lead)}</td>
                  <td className="min-w-56 px-2 py-2">
                    <div className="flex flex-col gap-1">
                      <input
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        placeholder="Paste email"
                        value={leadEmailEdits[row.lead.id] ?? row.lead.email ?? ""}
                        onChange={(event) =>
                          setLeadEmailEdits((current) => ({
                            ...current,
                            [row.lead.id]: event.target.value,
                          }))
                        }
                        onBlur={() =>
                          setLeadEmailEdits((current) => ({
                            ...current,
                            [row.lead.id]: normalizeEmailInput(current[row.lead.id] ?? row.lead.email ?? ""),
                          }))
                        }
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void saveLeadEmail(row.lead)}>
                          Save email
                        </button>
                        <span className="text-slate-600">{emailResearchStatus(row.lead)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <a
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      href={buildEmailResearchUrl(row.lead)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Find email
                    </a>
                    {!row.lead.email ? <p className="mt-1 text-xs text-amber-700">Missing email</p> : null}
                  </td>
                  <td className="px-2 py-2">{row.lead.phone ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.postcode ?? "-"} / {row.lead.cityTown ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.industrySlug ? formatIndustryLabel(row.lead.industrySlug) : "-"}</td>
                  <td className="px-2 py-2">{row.lead.currentProvider ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.estimatedCurrentMonthlyCost ?? "-"}</td>
                  <td className="px-2 py-2">{row.lead.marketingStatus ?? "ACTIVE"}</td>
                  <td className="px-2 py-2">{row.lead.lastContactedAt ? formatUkDateTime(row.lead.lastContactedAt) : "-"}</td>
                  <td className="px-2 py-2">{row.lead.lastCampaignStep ?? "-"}</td>
                  <td className="px-2 py-2">{row.eligible ? "Eligible" : row.reasons.join(", ")}</td>
                  <td className="px-2 py-2">
                    <button className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void deleteLead(row.lead.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Competitor/provider pricing</h2>
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
          Controlled selected sending is enabled with server-side suppression checks; unrestricted bulk blast sending remains disabled.
        </p>
      </section>
    </main>
  );
}
