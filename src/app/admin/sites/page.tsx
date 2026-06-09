"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  applyAdminSiteLifecycleAction,
  AdminSiteDomainSummary,
  AdminTenantSiteSummary,
  type AdminSiteLifecycleAction,
  createAdminTenantSiteFromSetupRequest,
  emailAdminSiteDnsInstructions,
  getAdminTenantSiteDetail,
  listAdminTenantSites,
  saveAdminSiteDomain,
  updateAdminSiteTaskStatus,
} from "@/lib/sites/admin-sites-client";
import {
  outlineButtonClass,
  primaryButtonClass,
  smallButtonClass,
} from "@/lib/ui/button-styles";
import { formatGbp, formatOptional, formatUkDateTime } from "@/lib/ui/display-labels";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import {
  DOMAIN_SETUP_MODES,
  DNS_WORKFLOW_STATUSES,
  SSL_WORKFLOW_STATUSES,
  dnsWorkflowStatusLabel,
  domainSetupModeLabel,
  lifecycleStatusLabel,
  setupRequestDomainOptionToMode,
  sslWorkflowStatusLabel,
} from "@/lib/sites/site-lifecycle";
import { buildDnsInstructionsText } from "@/lib/sites/domain-go-live";

const TASK_STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "SKIPPED"];

const SIMPLE_DOMAIN_STATUS_OPTIONS = [
  { value: "DETAILS_NEEDED", label: "Domain details needed" },
  { value: "DOMAIN_PURCHASED", label: "Domain purchased / owned" },
  { value: "INSTRUCTIONS_NEEDED", label: "DNS instructions needed" },
  { value: "WAITING_FOR_CUSTOMER_DNS", label: "Waiting for DNS" },
  { value: "DNS_CONFIGURED", label: "DNS configured" },
  { value: "DOMAIN_READY", label: "Ready to go live" },
  { value: "LIVE", label: "Live" },
  { value: "NEEDS_ATTENTION", label: "Needs attention" },
] as const;

type TaskGroupKey =
  | "setupReview"
  | "businessDetails"
  | "paymentSubscription"
  | "domainDns"
  | "siteConfiguration"
  | "goLive";

type SiteTask = {
  id: string;
  taskType: string;
  status: string;
  title: string;
  notes?: string | null;
};

const TASK_GROUP_LABELS: Record<TaskGroupKey, string> = {
  setupReview: "Setup review",
  businessDetails: "Business details",
  paymentSubscription: "Payment/subscription",
  domainDns: "Domain/DNS",
  siteConfiguration: "Site configuration",
  goLive: "Go-live",
};

function toMessage(error: string, status: number): string {
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" || status === 503) {
    return "Backend persistence is not configured for this environment yet.";
  }
  if (error === "FORBIDDEN" || status === 403) {
    return "Admin access denied. Check the allowlist and admin header email.";
  }
  if (error === "NETWORK_ERROR" || status === 0) {
    return "Network error while contacting backend API.";
  }
  if (error === "SETUP_REQUEST_NOT_PAID") {
    return "Payment must be completed before creating the subscriber site.";
  }
  if (error === "SETUP_REQUEST_CANCELLED") {
    return "Cancelled setup requests cannot create subscriber sites.";
  }
  if (error === "SETUP_REQUEST_ARCHIVED") {
    return "Archived setup requests cannot create subscriber sites.";
  }
  return `Request failed: ${error}`;
}

function groupTask(taskType: string): TaskGroupKey {
  if (taskType === "REVIEW_SETUP") return "setupReview";
  if (taskType === "CONFIRM_BUSINESS") return "businessDetails";
  if (taskType === "CONFIRM_SUBSCRIPTION") return "paymentSubscription";
  if (taskType === "CONFIRM_DOMAIN_OPTION" || taskType === "PREPARE_DNS") return "domainDns";
  if (taskType === "PREPARE_SITE_SETTINGS") return "siteConfiguration";
  return "goLive";
}

function getDomainOptionSummary(value?: string | null): string {
  if (!value) return "Not set";
  if (value === "EXISTING_DOMAIN") return "Existing domain";
  if (value === "CUSTOMER_BUYS_DOMAIN") return "Customer buys domain";
  if (value === "WE_REGISTER_DOMAIN") return "We register/manage domain";
  return value;
}

type DnsInstructionMetadata = {
  targetInstructions?: string;
  lastEmailStatus?: string;
  lastEmailSentAt?: string;
  lastEmailError?: string | null;
  lastEmailRecipient?: string;
};

function csvToJsonArray(value: string): string[] | undefined {
  const items = value
    .split(/[,\n\r]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

function jsonArrayToText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).join("\n");
}

function buildTargetInstructions(input: {
  dnsTargetInstructions: string;
  expectedDnsTarget: string;
  expectedNameserversText: string;
}): string {
  const explicit = input.dnsTargetInstructions.trim();
  if (explicit) return explicit;
  const lines: string[] = [];
  if (input.expectedDnsTarget.trim()) {
    lines.push(`DNS target: ${input.expectedDnsTarget.trim()}`);
  }
  const nameservers = csvToJsonArray(input.expectedNameserversText);
  if (nameservers?.length) {
    lines.push("Nameservers:");
    nameservers.forEach((nameserver) => lines.push(`- ${nameserver}`));
  }
  return lines.join("\n");
}

function getDnsInstructionMetadata(value: unknown): DnsInstructionMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    targetInstructions: typeof record.targetInstructions === "string" ? record.targetInstructions : undefined,
    lastEmailStatus: typeof record.lastEmailStatus === "string" ? record.lastEmailStatus : undefined,
    lastEmailSentAt: typeof record.lastEmailSentAt === "string" ? record.lastEmailSentAt : undefined,
    lastEmailError: typeof record.lastEmailError === "string" ? record.lastEmailError : null,
    lastEmailRecipient: typeof record.lastEmailRecipient === "string" ? record.lastEmailRecipient : undefined,
  };
}

function getDomainTypeHelper(value: string): string {
  if (value === "PRIMARY") return "Primary: main customer-facing website domain. For most customers, use Primary for their final website domain.";
  if (value === "WWW") return "www alias: www version that should point to the same site.";
  if (value === "APEX") return "Apex/root: bare domain without www.";
  return "Other alias: extra domain that should also point here.";
}

function simpleDomainStatusLabel(value?: string | null): string {
  return SIMPLE_DOMAIN_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? lifecycleStatusLabel(value);
}

function normalizeSimpleDomainStatus(value?: string | null): string {
  if (!value || value === "DOMAIN_PENDING" || value === "NOT_STARTED") return "DETAILS_NEEDED";
  if (SIMPLE_DOMAIN_STATUS_OPTIONS.some((option) => option.value === value)) return value;
  return "NEEDS_ATTENTION";
}

function checklistStatus(done: boolean, fallback = "Manual check needed"): string {
  return done ? "Yes" : fallback;
}

function formatValidationDetails(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  const messages = details
    .map((detail) => {
      if (!detail || typeof detail !== "object") return null;
      const record = detail as Record<string, unknown>;
      const path = Array.isArray(record.path) ? record.path.join(".") : "field";
      const message = typeof record.message === "string" ? record.message : "Invalid value";
      return `${path}: ${message}`;
    })
    .filter((message): message is string => Boolean(message));
  return messages.length ? messages.join("; ") : null;
}

function canSendCustomerDnsInstructions(domainOption?: string | null, setupMode?: string | null): boolean {
  return (
    domainOption === "EXISTING_DOMAIN" ||
    domainOption === "CUSTOMER_BUYS_DOMAIN" ||
    setupMode === "EXISTING_CUSTOMER_DOMAIN"
  );
}

function getDomainWorkflowNote(value?: string | null): string {
  if (value === "WE_REGISTER_DOMAIN") {
    return "Platform-managed domain: we handle manual registrar/DNS setup, then mark DNS configured and domain ready.";
  }
  if (value === "EXISTING_DOMAIN" || value === "CUSTOMER_BUYS_DOMAIN") {
    return "Customer-owned domain: send DNS instructions, then mark waiting for customer DNS while they update their domain provider.";
  }
  return "Domain route still needs confirmation before go-live.";
}

function lifecycleActionLabel(action: AdminSiteLifecycleAction): string {
  if (action === "MARK_DOMAIN_SEARCH_STARTED") return "Mark domain search started";
  if (action === "MARK_DOMAIN_PURCHASED_MANUALLY") return "Mark domain purchased manually";
  if (action === "MARK_DNS_INSTRUCTIONS_SENT") return "Mark DNS instructions sent";
  if (action === "MARK_WAITING_FOR_CUSTOMER_DNS") return "Mark waiting for customer DNS";
  if (action === "MARK_DNS_CONFIGURED") return "Mark DNS configured";
  if (action === "MARK_DOMAIN_READY") return "Mark domain configured/ready";
  if (action === "MARK_SITE_LIVE") return "Mark site live";
  if (action === "REACTIVATE_SITE") return "Reactivate site";
  return "Suspend site";
}

function domainReadinessGuidance(body: {
  blockReason?: string | null;
  domainStatus?: string | null;
  dnsStatus?: string | null;
  sslStatus?: string | null;
  tenantLifecycleStatus?: string | null;
  tenantProvisioningStatus?: string | null;
}): string | null {
  if (!body.blockReason || body.blockReason === "PLATFORM_HOST") return null;
  if (body.blockReason === "NO_SITE_DOMAIN_MATCH") return "No matching SiteDomain was found for this host.";
  if (body.blockReason === "SUSPENDED_OR_CANCELLED") return "The domain is matched, but the tenant or domain is suspended/cancelled.";
  return [
    "Domain is matched but not ready.",
    "Required: domain status Domain Ready/Live, DNS configured, SSL issued, tenant site Live.",
    `Current: Domain ${lifecycleStatusLabel(body.domainStatus)}, DNS ${dnsWorkflowStatusLabel(body.dnsStatus)}, SSL ${sslWorkflowStatusLabel(body.sslStatus)}, Tenant ${lifecycleStatusLabel(body.tenantLifecycleStatus)} / ${lifecycleStatusLabel(body.tenantProvisioningStatus)}.`,
  ].join(" ");
}

export default function AdminSitesPage() {
  const [siteIdFromQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("siteId")?.trim() ?? "";
  });

  const [setupRequestId, setSetupRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sites, setSites] = useState<AdminTenantSiteSummary[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [detail, setDetail] = useState<{
    site: AdminTenantSiteSummary;
    domains: AdminSiteDomainSummary[];
    tasks: SiteTask[];
    statusEvents: Array<{
      id: string;
      eventType: string;
      message?: string | null;
      createdAt: string;
    }>;
    subscription: {
      id: string;
      status: string;
      setupFeeGbp: number;
      monthlyFeeGbp: number;
      domainFeeGbp: number;
      whatsappAddonEnabled: boolean;
    } | null;
  } | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [domainTestHost, setDomainTestHost] = useState("");
  const [domainTestResult, setDomainTestResult] = useState<string | null>(null);
  const [dnsCopyStatus, setDnsCopyStatus] = useState<string | null>(null);
  const [dnsEmailStatus, setDnsEmailStatus] = useState<string | null>(null);
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainDraft, setDomainDraft] = useState({
    domain: "",
    domainType: "PRIMARY" as "PRIMARY" | "APEX" | "WWW" | "ALIAS",
    status: "DOMAIN_PENDING",
    domainSetupMode: "EXISTING_CUSTOMER_DOMAIN",
    dnsStatus: "INSTRUCTIONS_NEEDED",
    sslStatus: "NOT_STARTED",
    domainNotes: "",
    expectedDnsTarget: "",
    expectedNameserversText: "",
    manualDnsCheckResult: "VERIFIED" as "VERIFIED" | "FAILED" | "NEEDS_ATTENTION",
    manualDnsCheckNotes: "",
    registrarNotes: "",
    dnsTargetInstructions: "",
  });

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? detail?.site ?? null,
    [sites, selectedSiteId, detail],
  );

  const taskGroups = useMemo(() => {
    if (!detail) return [] as Array<{ key: TaskGroupKey; label: string; tasks: SiteTask[] }>;
    const grouped: Record<TaskGroupKey, typeof detail.tasks> = {
      setupReview: [],
      businessDetails: [],
      paymentSubscription: [],
      domainDns: [],
      siteConfiguration: [],
      goLive: [],
    };
    detail.tasks.forEach((task) => {
      grouped[groupTask(task.taskType)].push(task);
    });
    return (Object.keys(grouped) as TaskGroupKey[]).map((key) => ({
      key,
      label: TASK_GROUP_LABELS[key],
      tasks: grouped[key],
    }));
  }, [detail]);

  async function loadSites(): Promise<void> {
    setLoading(true);
    setMessage(null);

    const result = await listAdminTenantSites();
    if (!result.ok) {
      setSites([]);
      setDetail(null);
      setMessage(toMessage(result.error, result.status));
      setLoading(false);
      return;
    }

    setSites(result.sites);

    const queryMatch = siteIdFromQuery ? result.sites.find((site) => site.id === siteIdFromQuery) : null;
    const targetSite = queryMatch ?? result.sites[0] ?? null;

    if (targetSite) {
      setSelectedSiteId(targetSite.id);
      await loadSiteDetail(targetSite.id);
    } else {
      setSelectedSiteId("");
      setDetail(null);
    }

    setLoading(false);
  }

  async function loadSiteDetail(siteId: string): Promise<void> {
    const result = await getAdminTenantSiteDetail(siteId);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setSelectedSiteId(siteId);
    setDetail(result);
    const primaryDomain = result.domains.find((domain) => domain.domainType === "PRIMARY") ?? result.domains[0] ?? null;
    const dnsMetadata = getDnsInstructionMetadata(primaryDomain?.dnsInstructions);
    const setupMode = primaryDomain?.domainSetupMode ?? setupRequestDomainOptionToMode(result.site.setupRequest?.domainOption);
    setDomainDraft({
      domain: primaryDomain?.domain ?? result.site.domainPrimary ?? result.site.setupRequest?.existingDomain ?? result.site.setupRequest?.desiredDomain ?? "",
      domainType: (primaryDomain?.domainType as "PRIMARY" | "APEX" | "WWW" | "ALIAS" | undefined) ?? "PRIMARY",
      status: normalizeSimpleDomainStatus(primaryDomain?.status ?? result.site.domainStatus),
      domainSetupMode: setupMode,
      dnsStatus: primaryDomain?.dnsStatus ?? (primaryDomain?.status === "LIVE" ? "LIVE" : "INSTRUCTIONS_NEEDED"),
      sslStatus: primaryDomain?.sslStatus ?? "NOT_STARTED",
      domainNotes: primaryDomain?.domainNotes ?? "",
      expectedDnsTarget: primaryDomain?.expectedDnsTarget ?? "",
      expectedNameserversText: jsonArrayToText(primaryDomain?.expectedNameservers),
      manualDnsCheckResult: "VERIFIED",
      manualDnsCheckNotes: "",
      registrarNotes: primaryDomain?.registrarNotes ?? "",
      dnsTargetInstructions: dnsMetadata.targetInstructions ?? primaryDomain?.expectedDnsTarget ?? "",
    });
    setDnsEmailStatus(null);
    setTaskDrafts((current) => {
      const next = { ...current };
      result.tasks.forEach((task) => {
        if (!next[task.id]) next[task.id] = task.status;
      });
      return next;
    });
  }

  async function startSiteSetup(): Promise<void> {
    if (!setupRequestId.trim()) {
      setMessage("Enter a setup request id.");
      return;
    }

    const result = await createAdminTenantSiteFromSetupRequest(setupRequestId.trim());
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(
      result.created
        ? `Site created and linked: ${result.tenantSite.displayName}.`
        : `Site already exists: ${result.tenantSite.displayName}.`,
    );

    await loadSites();
    await loadSiteDetail(result.tenantSite.id);
  }

  async function saveTaskStatus(taskId: string): Promise<void> {
    if (!selectedSiteId) return;
    const status = taskDrafts[taskId];
    if (!status) return;

    const result = await updateAdminSiteTaskStatus(selectedSiteId, taskId, status);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    setMessage(`Task updated: ${result.task.title} -> ${result.task.status}.`);
    await loadSiteDetail(selectedSiteId);
  }

  async function runLifecycleAction(action: AdminSiteLifecycleAction): Promise<void> {
    if (!selectedSiteId) return;
    const confirmation =
      action === "SUSPEND_SITE"
        ? "Suspend this subscriber site? This does not cancel Stripe automatically and should only be used when platform access should be paused."
        : `${lifecycleActionLabel(action)}? DNS/domain changes are still manual; this only updates platform tracking.`;
    if (!window.confirm(confirmation)) return;

    const result = await applyAdminSiteLifecycleAction(selectedSiteId, action);
    if (!result.ok) {
      setMessage(toMessage(result.error, result.status));
      return;
    }

    const emailNote =
      action === "MARK_SITE_LIVE"
        ? result.emailStatus
          ? ` Go-live email: ${result.emailStatus}.`
          : " Go-live email was not attempted."
        : "";
    setMessage(`${lifecycleActionLabel(action)} completed.${emailNote}`);
    await loadSites();
    await loadSiteDetail(selectedSiteId);
  }

  async function saveDomainDraft(): Promise<void> {
    if (!selectedSiteId) return;
    if (!domainDraft.domain.trim()) {
      setMessage("Enter the intended live domain before saving.");
      return;
    }
    const normalizedDomain = domainDraft.domain.trim().toLowerCase();
    const existingDomain = detail?.domains.find(
      (domain) => domain.domain === normalizedDomain && domain.domainType === domainDraft.domainType,
    );
    const nextTargetInstructions = buildTargetInstructions(domainDraft);
    const existingDnsMetadata = getDnsInstructionMetadata(existingDomain?.dnsInstructions);
    const nextNameservers = csvToJsonArray(domainDraft.expectedNameserversText) ?? [];
    const existingNameservers = Array.isArray(existingDomain?.expectedNameservers)
      ? existingDomain.expectedNameservers.filter((item): item is string => typeof item === "string")
      : [];
    const unchanged =
      Boolean(existingDomain) &&
      existingDomain?.status === domainDraft.status &&
      existingDomain?.domainSetupMode === domainDraft.domainSetupMode &&
      existingDomain?.dnsStatus === domainDraft.dnsStatus &&
      existingDomain?.sslStatus === domainDraft.sslStatus &&
      (existingDomain?.domainNotes ?? "") === domainDraft.domainNotes.trim() &&
      (existingDomain?.expectedDnsTarget ?? "") === domainDraft.expectedDnsTarget.trim() &&
      existingNameservers.join("\n") === nextNameservers.join("\n") &&
      (existingDomain?.registrarNotes ?? "") === domainDraft.registrarNotes.trim() &&
      (existingDnsMetadata.targetInstructions ?? "") === nextTargetInstructions;
    if (unchanged) {
      setMessage("Domain settings already up to date.");
      return;
    }
    setDomainSaving(true);
    try {
      const result = await saveAdminSiteDomain(selectedSiteId, {
        domain: domainDraft.domain,
        domainType: domainDraft.domainType,
        status: domainDraft.status,
        domainStatus: domainDraft.status,
        domainSetupMode: domainDraft.domainSetupMode,
        dnsStatus: domainDraft.dnsStatus,
        sslStatus: domainDraft.sslStatus,
        domainNotes: domainDraft.domainNotes.trim() || null,
        expectedDnsTarget: domainDraft.expectedDnsTarget.trim() || null,
        expectedNameservers: csvToJsonArray(domainDraft.expectedNameserversText),
        registrarNotes: domainDraft.registrarNotes.trim() || null,
        dnsInstructions: {
          ...existingDnsMetadata,
          targetInstructions: nextTargetInstructions || undefined,
        },
      });
      if (!result.ok) {
        if (result.error === "SITE_DOMAIN_INVALID") {
          setMessage("Enter a valid domain/host, for example www.customerbusiness.co.uk.");
          return;
        }
        if (result.error === "SITE_DOMAIN_ALREADY_ASSIGNED") {
          setMessage("This domain is already assigned to another active subscriber site.");
          return;
        }
        if (result.error === "VALIDATION_ERROR") {
          const details = formatValidationDetails(result.details);
          setMessage(`Could not save domain settings: ${details ?? "validation failed."}`);
          return;
        }
        setMessage(toMessage(result.error, result.status));
        return;
      }
      setMessage("Domain settings saved.");
      await loadSites();
      await loadSiteDetail(selectedSiteId);
    } finally {
      setDomainSaving(false);
    }
  }

  async function markAmplifyDomainVerified(): Promise<void> {
    if (!selectedSiteId) return;
    if (!domainDraft.domain.trim()) {
      setMessage("Enter the intended live domain before marking Amplify verification.");
      return;
    }
    if (!window.confirm("Mark this domain verified in Amplify? This is a manual platform-admin assertion and does not call AWS.")) return;

    const checkedAt = new Date().toISOString();
    const existingDomain = detail?.domains.find(
      (domain) =>
        domain.domain === domainDraft.domain.trim().toLowerCase() &&
        domain.domainType === domainDraft.domainType,
    );
    const existingDnsMetadata = getDnsInstructionMetadata(existingDomain?.dnsInstructions);
    const amplifyNote = "Verified in Amplify custom domain management.";
    const result = await saveAdminSiteDomain(selectedSiteId, {
      domain: domainDraft.domain,
      domainType: domainDraft.domainType,
      status: "DOMAIN_READY",
      domainStatus: "DOMAIN_READY",
      domainSetupMode: domainDraft.domainSetupMode,
      dnsStatus: "VERIFIED",
      sslStatus: "ISSUED",
      dnsLastCheckedAt: checkedAt,
      dnsVerifiedAt: checkedAt,
      domainNotes: domainDraft.domainNotes.trim() || null,
      expectedDnsTarget: domainDraft.expectedDnsTarget.trim() || null,
      expectedNameservers: csvToJsonArray(domainDraft.expectedNameserversText),
      lastDnsCheckResult: {
        result: "VERIFIED",
        notes: amplifyNote,
        checkedAt,
      },
      registrarNotes: domainDraft.registrarNotes.trim()
        ? `${domainDraft.registrarNotes.trim()}\n${amplifyNote}`
        : amplifyNote,
      dnsInstructions: {
        ...existingDnsMetadata,
        targetInstructions: buildTargetInstructions(domainDraft) || existingDnsMetadata.targetInstructions,
      },
    });
    if (!result.ok) {
      if (result.error === "VALIDATION_ERROR") {
        const details = formatValidationDetails(result.details);
        setMessage(`Could not mark Amplify domain verified: ${details ?? "validation failed."}`);
        return;
      }
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setMessage("Amplify domain marked verified. Next step: mark domain configured/ready or mark site live when checks are complete.");
    await loadSites();
    await loadSiteDetail(selectedSiteId);
  }

  async function recordManualDnsCheck(): Promise<void> {
    if (!selectedSiteId) return;
    if (!domainDraft.domain.trim()) {
      setMessage("Save the intended live domain before recording a DNS check.");
      return;
    }
    const checkedAt = new Date().toISOString();
    const verified = domainDraft.manualDnsCheckResult === "VERIFIED";
    const result = await saveAdminSiteDomain(selectedSiteId, {
      domain: domainDraft.domain,
      domainType: domainDraft.domainType,
      status: verified ? "DNS_CONFIGURED" : "NEEDS_ATTENTION",
      domainStatus: verified ? "DNS_CONFIGURED" : "NEEDS_ATTENTION",
      domainSetupMode: domainDraft.domainSetupMode,
      dnsStatus: verified ? "VERIFIED" : "FAILED",
      sslStatus: domainDraft.sslStatus,
      dnsLastCheckedAt: checkedAt,
      dnsVerifiedAt: verified ? checkedAt : null,
      domainNotes: domainDraft.domainNotes.trim() || null,
      expectedDnsTarget: domainDraft.expectedDnsTarget.trim() || null,
      expectedNameservers: csvToJsonArray(domainDraft.expectedNameserversText),
      lastDnsCheckResult: {
        result: domainDraft.manualDnsCheckResult,
        notes: domainDraft.manualDnsCheckNotes.trim() || null,
        checkedAt,
      },
      registrarNotes: domainDraft.registrarNotes.trim() || null,
      dnsInstructions: {
        ...getDnsInstructionMetadata(
          detail?.domains.find(
            (domain) =>
              domain.domain === domainDraft.domain.trim().toLowerCase() &&
              domain.domainType === domainDraft.domainType,
          )?.dnsInstructions,
        ),
        targetInstructions: buildTargetInstructions(domainDraft) || undefined,
      },
    });
    if (!result.ok) {
      if (result.error === "VALIDATION_ERROR") {
        const details = formatValidationDetails(result.details);
        setMessage(`Could not record manual DNS check: ${details ?? "validation failed."}`);
        return;
      }
      setMessage(toMessage(result.error, result.status));
      return;
    }
    setMessage(`Manual DNS check recorded: ${domainDraft.manualDnsCheckResult}.`);
    await loadSites();
    await loadSiteDetail(selectedSiteId);
  }

  async function emailDnsInstructions(): Promise<void> {
    if (!selectedSiteId || !detail) return;
    const selectedDomain = detail.domains.find(
      (domain) => domain.domain === domainDraft.domain.trim().toLowerCase() && domain.domainType === domainDraft.domainType,
    ) ?? detail.domains.find((domain) => domain.domainType === "PRIMARY") ?? detail.domains[0];
    if (!selectedDomain) {
      setMessage("Save a SiteDomain record before emailing DNS instructions.");
      return;
    }
    if (!buildTargetInstructions(domainDraft)) {
      setMessage("DNS records have not been entered yet. Open Amplify Custom domains, copy the required DNS/verification values, save them here, then send instructions.");
      return;
    }
    if (!window.confirm(`Send DNS instructions to the customer for ${selectedDomain.domain}?`)) return;

    const result = await emailAdminSiteDnsInstructions(selectedSiteId, selectedDomain.id);
    if (!result.ok) {
      if (result.error === "DNS_TARGET_MISSING") {
        setMessage("DNS records have not been entered yet. Open Amplify Custom domains, copy the required DNS/verification values, save them here, then send instructions.");
        return;
      }
      if (result.error === "CONTACT_EMAIL_MISSING") {
        setMessage("No customer contact email is available for this setup request.");
        return;
      }
      setMessage(toMessage(result.error, result.status));
      return;
    }

    if (result.emailSent) {
      setDnsEmailStatus(`Email sent. Recommended next status: ${lifecycleStatusLabel(result.recommendedNextStatus)}.`);
      setMessage(`DNS instructions emailed to customer. Email status: ${result.emailStatus}.`);
    } else {
      setDnsEmailStatus(`Email failed/skipped: ${result.emailStatus}. Copy the DNS instructions manually for now.`);
      setMessage(`DNS instructions were not emailed. Email status: ${result.emailStatus}.`);
    }
    await loadSites();
    await loadSiteDetail(selectedSiteId);
  }

  async function copyDnsInstructions(): Promise<void> {
    if (!selectedSite || !detail) return;
    const requestedDomain =
      domainDraft.domain.trim() ||
      selectedSite.domainPrimary ||
      detail.domains[0]?.domain ||
      detail.site.setupRequest?.existingDomain ||
      detail.site.setupRequest?.desiredDomain ||
      null;
    const text = buildDnsInstructionsText({
      businessName: selectedSite.displayName,
      domainOption: detail.site.setupRequest?.domainOption,
      requestedDomain,
      previewUrl: `/sites/${selectedSite.slug}`,
      adminUrl: `/site-admin/${selectedSite.slug}`,
      dnsTargetInstructions: buildTargetInstructions(domainDraft),
    });
    try {
      await navigator.clipboard.writeText(text);
      setDnsCopyStatus("DNS instructions copied.");
    } catch {
      setDnsCopyStatus("Could not copy automatically. Select the text and copy it manually.");
    }
  }

  async function runDomainResolutionTest(): Promise<void> {
    const candidate = domainTestHost.trim();
    if (!candidate) {
      setDomainTestResult("Enter a domain/host to test.");
      return;
    }

    try {
      const response = await fetch("/api/site-resolve-debug", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-test-site-host": candidate,
        },
      });
      const body = (await response.json()) as
        | {
            ok?: boolean;
            error?: string;
            matched?: boolean;
            tenantSiteId?: string | null;
            tenantSlug?: string | null;
            domainStatus?: string | null;
            dnsStatus?: string | null;
            sslStatus?: string | null;
            tenantLifecycleStatus?: string | null;
            tenantProvisioningStatus?: string | null;
            blockReason?: string | null;
            wouldRender?: boolean;
            matchedDomain?: string | null;
            routeWouldRewriteTo?: string | null;
          }
        | null;

      if (!response.ok || !body?.ok) {
        setDomainTestResult(`Domain resolution test failed: ${body?.error ?? "UNKNOWN_ERROR"}`);
        return;
      }

      if (!body.matched) {
        setDomainTestResult(`No tenant match for "${candidate}".`);
        return;
      }

      setDomainTestResult(
        [
          `Internal mapping matched tenant ${body.tenantSlug ?? "(unknown)"} (${body.tenantSiteId ?? "n/a"}) via ${body.matchedDomain ?? candidate}.`,
          `Domain: ${body.domainStatus ?? "status unknown"}.`,
          `DNS: ${body.dnsStatus ?? "not set"}.`,
          `SSL: ${body.sslStatus ?? "not set"}.`,
          `Would render: ${body.routeWouldRewriteTo ?? "no rewrite target"}.`,
          body.wouldRender ? "Render gate: ready." : (domainReadinessGuidance(body) ?? "Render gate: not ready."),
          "This confirms MyExperiment.club knows which tenant should render once DNS points here; it does not prove public DNS propagation or SSL is live.",
        ].join(" "),
      );
    } catch {
      setDomainTestResult("Network error while testing domain resolution.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriber sites</h1>
          <p className="mt-2 text-sm text-slate-600">
            Persisted provisioning model. Platform-admin session required.
          </p>
        </div>
        <Link href="/admin" className={`${outlineButtonClass} ${smallButtonClass}`}>
          Back to admin
        </Link>
        <AdminLogoutButton />
      </div>
      <AdminPillNav />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Authenticated platform-admin session required.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${primaryButtonClass} ${smallButtonClass}`}
            onClick={loadSites}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load subscriber sites"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Create blank subscriber site from setup request</p>
          <p className="mt-1 text-xs text-slate-600">
            This creates live subscriber-site records with clean defaults. Demo data is not copied automatically.
            Paid setup requests ready for provisioning appear in Setup Requests. Once created, continue domain, DNS and go-live setup here.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={setupRequestId}
              onChange={(event) => setSetupRequestId(event.target.value)}
              placeholder="setup request id (cuid)"
              className="min-w-[280px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              className={`${primaryButtonClass} ${smallButtonClass}`}
              onClick={startSiteSetup}
            >
              Create blank subscriber site
            </button>
          </div>
        </div>

        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </section>

      {sites.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">Recently provisioned / continue setup</p>
          <p className="mt-1 text-xs text-emerald-900">
            Latest site: <span className="font-semibold">{sites[0]?.displayName}</span>. Select a site below to continue domain, DNS, admin and go-live checks.
          </p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Subscriber sites</h2>
          {sites.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No persisted sites loaded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => loadSiteDetail(site.id)}
                  className={`w-full rounded-xl border p-3 text-left ${
                    selectedSiteId === site.id
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{site.displayName}</p>
                  <div className="mt-1 grid gap-1 text-xs text-slate-600">
                    <p>Industry: {formatOptional(site.industrySlug)}</p>
                    <p>Lifecycle: {lifecycleStatusLabel(site.status)}</p>
                    <p>Provisioning: {lifecycleStatusLabel(site.provisioningStatus)}</p>
                    <p>Domain: {lifecycleStatusLabel(site.domainStatus)}</p>
                    <p>Subscription: {lifecycleStatusLabel(site.subscriptionStatus)}</p>
                    <p>Primary domain: {formatOptional(site.domainPrimary)}</p>
                    <p>WhatsApp add-on: {site.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                    <p>Created: {formatUkDateTime(site.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Selected site details</h2>
          {!selectedSite || !detail ? (
            <p className="mt-3 text-sm text-slate-600">Select a site to inspect provisioning details.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold">Business:</span> {selectedSite.displayName}</p>
                <p><span className="font-semibold">Industry:</span> {formatOptional(selectedSite.industrySlug)}</p>
                <p><span className="font-semibold">Lifecycle status:</span> {lifecycleStatusLabel(selectedSite.status)}</p>
                <p><span className="font-semibold">Provisioning status:</span> {lifecycleStatusLabel(selectedSite.provisioningStatus)}</p>
                <p><span className="font-semibold">Domain status:</span> {lifecycleStatusLabel(selectedSite.domainStatus)}</p>
                <p><span className="font-semibold">Subscription status:</span> {lifecycleStatusLabel(selectedSite.subscriptionStatus)}</p>
                <p><span className="font-semibold">Primary domain:</span> {formatOptional(selectedSite.domainPrimary)}</p>
                <p><span className="font-semibold">WhatsApp add-on:</span> {selectedSite.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                <p><span className="font-semibold">Created:</span> {formatUkDateTime(selectedSite.createdAt)}</p>
                <p>
                  <span className="font-semibold">Public URL:</span>{" "}
                  <Link
                    href={`/sites/${encodeURIComponent(selectedSite.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 underline underline-offset-2"
                  >
                    /sites/{selectedSite.slug}
                  </Link>
                </p>
                <p>
                  <span className="font-semibold">Subscriber admin:</span>{" "}
                  <Link
                    href={`/site-admin/${encodeURIComponent(selectedSite.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 underline underline-offset-2"
                  >
                    /site-admin/{selectedSite.slug}
                  </Link>
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="text-sm font-semibold text-sky-950">Domain and go-live actions</p>
                <p className="mt-1 text-xs text-sky-900">
                  These actions update platform tracking only. Domain purchase, DNS records, certificate checks and final host routing are still manual/future work.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    "MARK_DOMAIN_SEARCH_STARTED",
                    "MARK_DOMAIN_PURCHASED_MANUALLY",
                    "MARK_DNS_INSTRUCTIONS_SENT",
                    "MARK_WAITING_FOR_CUSTOMER_DNS",
                    "MARK_DNS_CONFIGURED",
                    "MARK_DOMAIN_READY",
                    "MARK_SITE_LIVE",
                    "SUSPEND_SITE",
                    ...(selectedSite.status === "SUSPENDED" || selectedSite.provisioningStatus === "SUSPENDED"
                      ? ["REACTIVATE_SITE" as const]
                      : []),
                  ] as AdminSiteLifecycleAction[]).map((action) => (
                    <button
                      key={action}
                      type="button"
                      className={`${action === "SUSPEND_SITE" ? "rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" : action === "REACTIVATE_SITE" ? "rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50" : `${outlineButtonClass} ${smallButtonClass}`}`}
                      onClick={() => {
                        void runLifecycleAction(action);
                      }}
                    >
                      {lifecycleActionLabel(action)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Link
                  href={`/admin/sites/${encodeURIComponent(selectedSite.id)}/settings`}
                  className={`${primaryButtonClass} ${smallButtonClass}`}
                >
                  Persisted site settings
                </Link>
                <Link
                  href={`/admin/sites/${encodeURIComponent(selectedSite.id)}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-2 ${outlineButtonClass} ${smallButtonClass}`}
                >
                  Open persisted site preview
                </Link>
                <p className="mt-2 text-xs text-slate-600">
                  Support/provisioning settings editor until subscriber admin auth is added.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Domain panel</p>
                <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                  <p><span className="font-semibold">Domain option:</span> {getDomainOptionSummary(detail.site.setupRequest?.domainOption)}</p>
                  <p><span className="font-semibold">Domain status:</span> {simpleDomainStatusLabel(selectedSite.domainStatus)}</p>
                  <p><span className="font-semibold">Existing domain:</span> {formatOptional(detail.site.setupRequest?.existingDomain)}</p>
                  <p><span className="font-semibold">Desired domain:</span> {formatOptional(detail.site.setupRequest?.desiredDomain)}</p>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-900">Domain/go-live mini checklist</p>
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <p><span className="font-semibold">Internal SiteDomain saved:</span> {checklistStatus(detail.domains.length > 0, "No")}</p>
                    <p><span className="font-semibold">Resolver maps domain to tenant:</span> {checklistStatus(Boolean(domainTestResult?.startsWith("Internal mapping matched")), "Run resolver test")}</p>
                    <p><span className="font-semibold">Amplify custom domain created:</span> Manual check needed</p>
                    <p><span className="font-semibold">DNS target values recorded:</span> {checklistStatus(Boolean(buildTargetInstructions(domainDraft)), "No")}</p>
                    <p><span className="font-semibold">DNS records configured:</span> {checklistStatus(domainDraft.dnsStatus === "VERIFIED" || ["DNS_CONFIGURED", "DOMAIN_READY", "LIVE"].includes(domainDraft.status), "Manual check needed")}</p>
                    <p><span className="font-semibold">SSL/certificate ready:</span> {checklistStatus(domainDraft.sslStatus === "ISSUED")}</p>
                    <p><span className="font-semibold">Site marked live:</span> {checklistStatus(selectedSite.status === "LIVE" || selectedSite.provisioningStatus === "LIVE" || domainDraft.status === "LIVE", "No")}</p>
                    <p><span className="font-semibold">Public domain tested:</span> Manual check needed</p>
                  </div>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-900">Intended live domain / SiteDomain record</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Save the final customer-facing domain here. Protocols, paths and uppercase text are normalised before saving.
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {getDomainWorkflowNote(detail.site.setupRequest?.domainOption)}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Domain / host
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.domain}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, domain: event.target.value }))}
                        placeholder="www.customerbusiness.co.uk"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Domain type
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.domainType}
                        onChange={(event) =>
                          setDomainDraft((current) => ({
                            ...current,
                            domainType: event.target.value as typeof domainDraft.domainType,
                          }))
                        }
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="WWW">www alias</option>
                        <option value="APEX">Apex/root</option>
                        <option value="ALIAS">Other alias</option>
                      </select>
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        {getDomainTypeHelper(domainDraft.domainType)}
                        {" "}For most customers, use Primary. Add www/apex aliases only when deliberately configuring multiple hostnames.
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Domain status
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.status}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, status: event.target.value }))}
                      >
                        {SIMPLE_DOMAIN_STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        Simplified operator flow. Advanced/internal statuses remain available in stored history where needed.
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      Domain setup mode
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.domainSetupMode}
                        onChange={(event) =>
                          setDomainDraft((current) => ({
                            ...current,
                            domainSetupMode: event.target.value,
                          }))
                        }
                      >
                        {DOMAIN_SETUP_MODES.map((mode) => (
                          <option key={mode} value={mode}>
                            {domainSetupModeLabel(mode)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      DNS status
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.dnsStatus}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, dnsStatus: event.target.value }))}
                      >
                        {DNS_WORKFLOW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {dnsWorkflowStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-700">
                      SSL status
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.sslStatus}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, sslStatus: event.target.value }))}
                      >
                        {SSL_WORKFLOW_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {sslWorkflowStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 sm:col-span-2">
                      <p className="font-semibold">Amplify/manual verification</p>
                      <p className="mt-1">
                        If Amplify shows this custom domain as available and SSL managed, you can record that manual
                        verification here. Missing DNS target values still block customer DNS emails, but they do not
                        block platform-managed go-live status saves.
                      </p>
                      <button
                        type="button"
                        className={`mt-2 ${outlineButtonClass} ${smallButtonClass}`}
                        onClick={() => void markAmplifyDomainVerified()}
                      >
                        Mark Amplify domain verified
                      </button>
                    </div>
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-950 sm:col-span-2">
                      <p className="font-semibold">Where do I get these DNS values?</p>
                      <p className="mt-1">
                        For Amplify-hosted sites, open AWS Amplify - your app - Hosting - Custom domains - Add domain.
                        Amplify will provide the verification and DNS records needed for this domain. Copy those exact
                        values here so they can be included in customer instructions and go-live checks.
                      </p>
                      <p className="mt-2 font-semibold">
                        Do not invent DNS values. Leave this blank until Amplify shows the required records.
                      </p>
                      <p className="mt-1">
                        If the domain is in Route 53, Amplify may create or verify some records automatically. If records
                        must be added manually, copy the exact CNAME, A/ALIAS, TXT or verification values from Amplify.
                      </p>
                    </div>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Amplify/hosting DNS target
                      <input
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.expectedDnsTarget}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, expectedDnsTarget: event.target.value }))}
                        placeholder="CNAME/A/TXT target or hosting verification value"
                      />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        CNAME, A/ALIAS, or hosting target shown by Amplify.
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Nameservers, if customer is changing nameservers
                      <textarea
                        className="mt-1 min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.expectedNameserversText}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, expectedNameserversText: event.target.value }))}
                        placeholder="One nameserver per line, if nameserver handover is used."
                      />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        Only use if the customer is moving DNS management. Usually blank for Route 53/manual record setup.
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Verification records
                      <textarea
                        className="mt-1 min-h-[110px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.dnsTargetInstructions}
                        onChange={(event) =>
                          setDomainDraft((current) => ({
                            ...current,
                            dnsTargetInstructions: event.target.value,
                          }))
                        }
                        placeholder={"Paste exact nameserver, CNAME, A, TXT or hosting verification values here. Do not invent values."}
                      />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">
                        CNAME/TXT verification records shown by Amplify for SSL/domain ownership. These values are included in customer DNS emails.
                      </span>
                    </label>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Domain notes
                      <textarea
                        className="mt-1 min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.domainNotes}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, domainNotes: event.target.value }))}
                        placeholder="Customer domain route, advice needed, manual DNS check notes..."
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                      Registrar/domain admin notes
                      <textarea
                        className="mt-1 min-h-[70px] w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={domainDraft.registrarNotes}
                        onChange={(event) => setDomainDraft((current) => ({ ...current, registrarNotes: event.target.value }))}
                        placeholder="Registrar, renewal/ownership notes, DNS notes, customer instructions..."
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className={`mt-3 ${primaryButtonClass} ${smallButtonClass}`}
                    onClick={() => void saveDomainDraft()}
                    disabled={domainSaving}
                  >
                    {domainSaving ? "Saving SiteDomain..." : "Save SiteDomain"}
                  </button>
                  {message ? (
                    <p className="mt-2 text-xs font-semibold text-slate-700">{message}</p>
                  ) : null}
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-900">Record manual DNS check</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Result
                        <select
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                          value={domainDraft.manualDnsCheckResult}
                          onChange={(event) =>
                            setDomainDraft((current) => ({
                              ...current,
                              manualDnsCheckResult: event.target.value as typeof domainDraft.manualDnsCheckResult,
                            }))
                          }
                        >
                          <option value="VERIFIED">Verified</option>
                          <option value="FAILED">Not verified</option>
                          <option value="NEEDS_ATTENTION">Needs attention</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-700">
                        Check notes
                        <input
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                          value={domainDraft.manualDnsCheckNotes}
                          onChange={(event) => setDomainDraft((current) => ({ ...current, manualDnsCheckNotes: event.target.value }))}
                          placeholder="Manual lookup result or customer DNS note"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className={`mt-2 ${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => void recordManualDnsCheck()}
                    >
                      Record manual DNS check
                    </button>
                  </div>
                </div>
                {detail.domains.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No SiteDomain records yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.domains.map((domain) => {
                      const dnsMetadata = getDnsInstructionMetadata(domain.dnsInstructions);
                      return (
                        <div key={domain.id} className="rounded-md border border-slate-200 bg-white p-2">
                          <p>
                            {domain.domain} ({domain.domainType}) - {simpleDomainStatusLabel(domain.status)}
                            {domain.registrarNotes ? ` | ${domain.registrarNotes}` : ""}
                          </p>
                          <p>
                            Mode: {domainSetupModeLabel(domain.domainSetupMode)} | DNS: {dnsWorkflowStatusLabel(domain.dnsStatus)} | SSL: {sslWorkflowStatusLabel(domain.sslStatus)}
                          </p>
                          {domain.expectedDnsTarget ? <p>Expected DNS target: {domain.expectedDnsTarget}</p> : null}
                          {Array.isArray(domain.expectedNameservers) && domain.expectedNameservers.length ? (
                            <p>Expected nameservers: {domain.expectedNameservers.filter((item) => typeof item === "string").join(", ")}</p>
                          ) : null}
                          <p>
                            Last checked: {domain.dnsLastCheckedAt ? formatUkDateTime(domain.dnsLastCheckedAt) : "Not checked"}
                            {domain.dnsVerifiedAt ? ` | Verified: ${formatUkDateTime(domain.dnsVerifiedAt)}` : ""}
                          </p>
                          {domain.domainNotes ? <p>Domain notes: {domain.domainNotes}</p> : null}
                          <p className={dnsMetadata.targetInstructions ? "text-emerald-700" : "text-amber-700"}>
                            DNS target values: {dnsMetadata.targetInstructions ? "Saved" : "Missing"}
                          </p>
                          {dnsMetadata.lastEmailStatus ? (
                            <p>
                              Last DNS email: {dnsMetadata.lastEmailStatus}
                              {dnsMetadata.lastEmailSentAt ? ` at ${formatUkDateTime(dnsMetadata.lastEmailSentAt)}` : ""}
                              {dnsMetadata.lastEmailRecipient ? ` to ${dnsMetadata.lastEmailRecipient}` : ""}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-600">
                  DNS/domain automation is not live yet. Custom-domain runtime will resolve SiteDomain to TenantSite once host routing is enabled.
                </p>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">DNS instruction copy</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Copy this text manually or email it to the customer once real DNS/hosting target values are saved.
                        Customer-owned domains should then move to waiting for customer DNS.
                      </p>
                      {!canSendCustomerDnsInstructions(detail.site.setupRequest?.domainOption, domainDraft.domainSetupMode) ? (
                        <p className="mt-1 text-xs text-slate-600">
                          This looks like a platform-managed or unconfirmed domain route, so keep the DNS target values as internal fulfilment notes unless the customer needs to update DNS themselves.
                        </p>
                      ) : null}
                      {!buildTargetInstructions(domainDraft) ? (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          DNS records have not been entered yet. Open Amplify Custom domains, copy the required DNS/verification values, save them here, then send instructions.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${outlineButtonClass} ${smallButtonClass}`}
                        onClick={() => void copyDnsInstructions()}
                      >
                        Copy DNS instructions
                      </button>
                      <button
                        type="button"
                        className={`${primaryButtonClass} ${smallButtonClass}`}
                        onClick={() => void emailDnsInstructions()}
                        disabled={
                          !buildTargetInstructions(domainDraft) ||
                          !canSendCustomerDnsInstructions(detail.site.setupRequest?.domainOption, domainDraft.domainSetupMode)
                        }
                      >
                        Send DNS instructions
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] text-slate-700">
                    {buildDnsInstructionsText({
                      businessName: selectedSite.displayName,
                      domainOption: detail.site.setupRequest?.domainOption,
                      requestedDomain:
                        domainDraft.domain.trim() ||
                        selectedSite.domainPrimary ||
                        detail.domains[0]?.domain ||
                        detail.site.setupRequest?.existingDomain ||
                        detail.site.setupRequest?.desiredDomain ||
                        null,
                      previewUrl: `/sites/${selectedSite.slug}`,
                      adminUrl: `/site-admin/${selectedSite.slug}`,
                      dnsTargetInstructions: buildTargetInstructions(domainDraft),
                    })}
                  </pre>
                  {dnsCopyStatus ? <p className="mt-2 text-xs text-slate-600">{dnsCopyStatus}</p> : null}
                  {dnsEmailStatus ? <p className="mt-2 text-xs text-slate-600">{dnsEmailStatus}</p> : null}
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                  <p className="text-xs font-semibold text-slate-900">Test domain resolution</p>
                  <p className="mt-1 text-xs text-slate-600">
                    This checks MyExperiment.club&apos;s internal mapping only. It does not prove public DNS or SSL is live yet.
                    If this says matched tenant, the platform knows which site should render once DNS points here.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={domainTestHost}
                      onChange={(event) => setDomainTestHost(event.target.value)}
                      placeholder="example.com"
                      className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      className={`${outlineButtonClass} ${smallButtonClass}`}
                      onClick={() => {
                        void runDomainResolutionTest();
                      }}
                    >
                      Test custom domain routing
                    </button>
                  </div>
                  {domainTestResult ? (
                    <p className="mt-2 text-xs text-slate-700">{domainTestResult}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Provisioning checklist</p>
                {taskGroups.every((group) => group.tasks.length === 0) ? (
                  <p className="mt-2 text-xs text-slate-600">No tasks available.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {taskGroups.map((group) => (
                      <div key={group.key} className="rounded-lg border border-slate-200 bg-white p-2">
                        <p className="text-xs font-semibold text-slate-900">{group.label}</p>
                        {group.tasks.length === 0 ? (
                          <p className="mt-1 text-xs text-slate-500">No tasks in this group.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {group.tasks.map((task) => (
                              <div key={task.id} className="rounded-md border border-slate-200 p-2">
                                <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                                <p className="text-xs text-slate-600">Status: {task.status}</p>
                                <p className="text-xs text-slate-600">Notes: {formatOptional(task.notes)}</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <select
                                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                                    value={taskDrafts[task.id] ?? task.status}
                                    onChange={(event) =>
                                      setTaskDrafts((current) => ({ ...current, [task.id]: event.target.value }))
                                    }
                                  >
                                    {TASK_STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className={`${outlineButtonClass} ${smallButtonClass}`}
                                    onClick={() => saveTaskStatus(task.id)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Subscription placeholder</p>
                {!detail.subscription ? (
                  <p className="mt-2 text-xs text-slate-600">No subscription placeholder found.</p>
                ) : (
                  <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                    <p><span className="font-semibold">Status:</span> {detail.subscription.status}</p>
                    <p><span className="font-semibold">Setup fee:</span> {formatGbp(detail.subscription.setupFeeGbp)}</p>
                    <p><span className="font-semibold">Monthly fee:</span> {formatGbp(detail.subscription.monthlyFeeGbp)}</p>
                    <p><span className="font-semibold">Domain fee:</span> {formatGbp(detail.subscription.domainFeeGbp)}</p>
                    <p><span className="font-semibold">WhatsApp add-on:</span> {detail.subscription.whatsappAddonEnabled ? "Enabled" : "Disabled"}</p>
                    <p><span className="font-semibold">Payment status:</span> Placeholder (no live payments yet)</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Status event timeline</p>
                {detail.statusEvents.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No events yet.</p>
                ) : (
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    {detail.statusEvents.map((event) => (
                      <p key={event.id}>
                        {formatUkDateTime(event.createdAt)} - {event.eventType}
                        {event.message ? `: ${event.message}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

