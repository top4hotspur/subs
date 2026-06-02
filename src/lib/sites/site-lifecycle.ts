export const SITE_LIFECYCLE_STATUSES = [
  "PROVISIONED",
  "DOMAIN_PENDING",
  "DOMAIN_READY",
  "LIVE",
  "SUSPENDED",
  "CANCELLED",
] as const;

export type SiteLifecycleStatus = (typeof SITE_LIFECYCLE_STATUSES)[number];

export const SITE_DOMAIN_STATUSES = [
  "NOT_STARTED",
  "REQUESTED",
  "DETAILS_NEEDED",
  "DOMAIN_PENDING",
  "DNS_INSTRUCTIONS_SENT",
  "WAITING_FOR_CUSTOMER_DNS",
  "DNS_CONFIGURED",
  "DOMAIN_READY",
  "READY",
  "LIVE",
  "NEEDS_ATTENTION",
  "FAILED",
  "SUSPENDED",
  "CANCELLED",
] as const;

export type SiteDomainLifecycleStatus = (typeof SITE_DOMAIN_STATUSES)[number];

export const SITE_LIFECYCLE_ACTIONS = [
  "MARK_DNS_INSTRUCTIONS_SENT",
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
