import { prisma } from "@/lib/db/prisma";

export type ResolvedTenantSite = {
  tenantSiteId: string;
  tenantSlug: string;
  tenantDisplayName: string;
  domain: string;
  domainType: string;
  domainStatus: string;
  dnsStatus?: string | null;
  sslStatus?: string | null;
  siteStatus?: string | null;
  provisioningStatus?: string | null;
  subscriptionStatus?: string | null;
};

function trimProtocolAndPath(value: string): string {
  const cleaned = value.trim();
  if (!cleaned) return "";
  const withoutProtocol = cleaned.replace(/^[a-z]+:\/\//i, "");
  const slashIndex = withoutProtocol.indexOf("/");
  return slashIndex >= 0 ? withoutProtocol.slice(0, slashIndex) : withoutProtocol;
}

export function normalizeHost(host: string): string {
  const raw = trimProtocolAndPath(host).toLowerCase();
  if (!raw) return "";
  const withoutPort = raw.split(":")[0] ?? "";
  return withoutPort.replace(/\.$/, "").trim();
}

export async function getTenantSiteBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  return prisma.tenantSite.findUnique({
    where: { slug: normalized },
    select: {
      id: true,
      slug: true,
      displayName: true,
      provisioningStatus: true,
      domainStatus: true,
    },
  });
}

function buildHostCandidates(normalizedHost: string): string[] {
  if (!normalizedHost) return [];
  const candidates = new Set<string>([normalizedHost]);
  if (normalizedHost.startsWith("www.")) {
    candidates.add(normalizedHost.slice(4));
  } else {
    candidates.add(`www.${normalizedHost}`);
  }
  return [...candidates];
}

function domainTypePriority(domainType: string): number {
  if (domainType === "PRIMARY") return 0;
  if (domainType === "APEX") return 1;
  if (domainType === "WWW") return 2;
  return 3;
}

function isLocalDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

const ACTIVE_DOMAIN_STATUSES = [
  "REQUESTED",
  "DETAILS_NEEDED",
  "DOMAIN_TO_BUY",
  "DOMAIN_SEARCH_STARTED",
  "DOMAIN_AVAILABLE",
  "DOMAIN_PURCHASED",
  "DOMAIN_PENDING",
  "DNS_INSTRUCTIONS_SENT",
  "WAITING_FOR_CUSTOMER_DNS",
  "DNS_CONFIGURED",
  "DOMAIN_READY",
  "READY",
  "LIVE",
];

export const LIVE_DOMAIN_STATUSES = ["DNS_CONFIGURED", "DOMAIN_READY", "READY", "LIVE"];

export function isTenantUnavailableStatus(value?: string | null): boolean {
  return value === "SUSPENDED" || value === "CANCELLED";
}

export function getTenantDomainBlockReason(match: ResolvedTenantSite | null): string | null {
  if (!match) return "NO_SITE_DOMAIN_MATCH";
  if (
    isTenantUnavailableStatus(match.siteStatus) ||
    isTenantUnavailableStatus(match.provisioningStatus) ||
    isTenantUnavailableStatus(match.domainStatus)
  ) {
    return "SUSPENDED_OR_CANCELLED";
  }
  if (!LIVE_DOMAIN_STATUSES.includes(match.domainStatus)) return "DOMAIN_NOT_READY";
  if (match.siteStatus !== "LIVE" && match.provisioningStatus !== "LIVE") return "SITE_NOT_LIVE";
  return null;
}

export function isTenantDomainRenderable(match: ResolvedTenantSite | null): boolean {
  return getTenantDomainBlockReason(match) === null;
}

export async function getTenantSiteByDomainHost(
  host: string,
  options: { requireLive?: boolean; includeUnavailable?: boolean } = {},
): Promise<ResolvedTenantSite | null> {
  const normalized = normalizeHost(host);
  if (!normalized || isLocalDevHost(normalized)) return null;

  const candidates = buildHostCandidates(normalized);
  const domainMatches = await prisma.siteDomain.findMany({
    where: {
      domain: { in: candidates },
      status: options.includeUnavailable
        ? undefined
        : options.requireLive
          ? { in: LIVE_DOMAIN_STATUSES }
          : { in: ACTIVE_DOMAIN_STATUSES },
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      domain: true,
      domainType: true,
      status: true,
      dnsStatus: true,
      sslStatus: true,
      tenantSite: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          status: true,
          provisioningStatus: true,
          subscriptionStatus: true,
        },
      },
    },
  });

  const domainMatch = domainMatches.sort((left, right) => {
    const leftHostPriority = candidates.indexOf(left.domain);
    const rightHostPriority = candidates.indexOf(right.domain);
    if (leftHostPriority !== rightHostPriority) return leftHostPriority - rightHostPriority;
    const leftTypePriority = domainTypePriority(left.domainType);
    const rightTypePriority = domainTypePriority(right.domainType);
    return leftTypePriority - rightTypePriority;
  })[0];

  if (!domainMatch) return null;
  if (!options.includeUnavailable) {
    if (domainMatch.tenantSite.status === "SUSPENDED" || domainMatch.tenantSite.status === "CANCELLED") return null;
    if (domainMatch.tenantSite.provisioningStatus === "SUSPENDED" || domainMatch.tenantSite.provisioningStatus === "CANCELLED") return null;
  }

  return {
    tenantSiteId: domainMatch.tenantSite.id,
    tenantSlug: domainMatch.tenantSite.slug,
    tenantDisplayName: domainMatch.tenantSite.displayName,
    domain: domainMatch.domain,
    domainType: domainMatch.domainType,
    domainStatus: domainMatch.status,
    dnsStatus: domainMatch.dnsStatus,
    sslStatus: domainMatch.sslStatus,
    siteStatus: domainMatch.tenantSite.status,
    provisioningStatus: domainMatch.tenantSite.provisioningStatus,
    subscriptionStatus: domainMatch.tenantSite.subscriptionStatus,
  };
}

export async function resolveTenantSiteByHost(
  host: string,
  options: { requireLive?: boolean; includeUnavailable?: boolean } = {},
): Promise<ResolvedTenantSite | null> {
  return getTenantSiteByDomainHost(host, options);
}

export async function getLiveTenantSiteByDomainHost(host: string): Promise<ResolvedTenantSite | null> {
  const match = await getTenantSiteByDomainHost(host, { requireLive: true });
  if (!match) return null;
  if (!isTenantDomainRenderable(match)) return null;
  return match;
}

export async function resolveTenantFromRequestHost(
  requestHeaders: Headers,
): Promise<ResolvedTenantSite | null> {
  const hostHeader =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "";
  return getTenantSiteByDomainHost(hostHeader);
}
