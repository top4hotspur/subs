export const SITE_LIFECYCLE_STATUSES = [
  "PROVISIONED",
  "SETUP_IN_PROGRESS",
  "DOMAIN_PENDING",
  "DOMAIN_READY",
  "LIVE",
  "SUSPENDED",
  "CANCELLED",
] as const;

export type SiteLifecycleStatus = (typeof SITE_LIFECYCLE_STATUSES)[number];

export const SITE_DOMAIN_STATUSES = [
  "NOT_STARTED",
  "INSTRUCTIONS_NEEDED",
  "REQUESTED",
  "DETAILS_NEEDED",
  "DOMAIN_TO_BUY",
  "DOMAIN_SEARCH_STARTED",
  "DOMAIN_AVAILABLE",
  "DOMAIN_PURCHASED",
  "DOMAIN_PENDING",
  "DNS_INSTRUCTIONS_SENT",
  "WAITING_FOR_CUSTOMER_DNS",
  "PENDING_PROPAGATION",
  "DNS_CONFIGURED",
  "DOMAIN_READY",
  "READY",
  "LIVE",
  "NEEDS_ATTENTION",
  "INSTRUCTIONS_SENT",
  "FAILED",
  "SUSPENDED",
  "CANCELLED",
] as const;

export type SiteDomainLifecycleStatus = (typeof SITE_DOMAIN_STATUSES)[number];

export const DOMAIN_SETUP_MODES = [
  "EXISTING_CUSTOMER_DOMAIN",
  "NEW_DOMAIN_MANAGED",
  "UNSURE",
] as const;

export type DomainSetupMode = (typeof DOMAIN_SETUP_MODES)[number];

export const DNS_WORKFLOW_STATUSES = [
  "NOT_STARTED",
  "INSTRUCTIONS_NEEDED",
  "INSTRUCTIONS_SENT",
  "WAITING_FOR_CUSTOMER",
  "PENDING_PROPAGATION",
  "VERIFIED",
  "FAILED",
  "LIVE",
] as const;

export type DnsWorkflowStatus = (typeof DNS_WORKFLOW_STATUSES)[number];

export const SSL_WORKFLOW_STATUSES = [
  "NOT_STARTED",
  "PENDING",
  "ISSUED",
  "FAILED",
] as const;

export type SslWorkflowStatus = (typeof SSL_WORKFLOW_STATUSES)[number];

export const SITE_LIFECYCLE_ACTIONS = [
  "MARK_DOMAIN_SEARCH_STARTED",
  "MARK_DOMAIN_PURCHASED_MANUALLY",
  "MARK_DNS_INSTRUCTIONS_SENT",
  "MARK_WAITING_FOR_CUSTOMER_DNS",
  "MARK_DNS_CONFIGURED",
  "MARK_DOMAIN_READY",
  "MARK_SITE_LIVE",
  "SUSPEND_SITE",
  "REACTIVATE_SITE",
] as const;

export type SiteLifecycleAction = (typeof SITE_LIFECYCLE_ACTIONS)[number];

export function lifecycleStatusLabel(value?: string | null): string {
  if (!value) return "Not set";
  return value
    .replace(/^SITE_/, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function domainSetupModeLabel(value?: string | null): string {
  if (value === "EXISTING_CUSTOMER_DOMAIN") return "Existing customer domain";
  if (value === "NEW_DOMAIN_MANAGED") return "New domain managed by us";
  if (value === "UNSURE") return "Unsure / needs advice";
  return lifecycleStatusLabel(value);
}

export function dnsWorkflowStatusLabel(value?: string | null): string {
  if (value === "INSTRUCTIONS_NEEDED") return "Instructions needed";
  if (value === "INSTRUCTIONS_SENT") return "Instructions sent";
  if (value === "WAITING_FOR_CUSTOMER") return "Waiting for customer";
  if (value === "PENDING_PROPAGATION") return "Pending propagation";
  if (value === "FAILED") return "Failed / needs attention";
  return lifecycleStatusLabel(value);
}

export function sslWorkflowStatusLabel(value?: string | null): string {
  return lifecycleStatusLabel(value);
}

export function setupRequestDomainOptionToMode(value?: string | null): DomainSetupMode {
  if (value === "WE_REGISTER_DOMAIN") return "NEW_DOMAIN_MANAGED";
  if (value === "UNSURE") return "UNSURE";
  return "EXISTING_CUSTOMER_DOMAIN";
}

export function initialDnsStatusForSetupMode(mode: DomainSetupMode): DnsWorkflowStatus {
  if (mode === "NEW_DOMAIN_MANAGED") return "INSTRUCTIONS_NEEDED";
  if (mode === "UNSURE") return "INSTRUCTIONS_NEEDED";
  return "INSTRUCTIONS_NEEDED";
}
