import { prisma } from "@/lib/db/prisma";

type ResolvedTenantSite = {
  tenantSiteId: string;
  tenantSlug: string;
  tenantDisplayName: string;
  domain: string;
  domainType: string;
  domainStatus: string;
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

function isLocalDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export async function getTenantSiteByDomainHost(
  host: string,
): Promise<ResolvedTenantSite | null> {
  const normalized = normalizeHost(host);
  if (!normalized || isLocalDevHost(normalized)) return null;

  const candidates = buildHostCandidates(normalized);
  const domainMatch = await prisma.siteDomain.findFirst({
    where: {
      domain: { in: candidates },
      // Keep broad for current provisioning/testing statuses.
      // Future hardening can restrict to connected/verified live statuses.
      status: { notIn: ["ARCHIVED", "REMOVED", "DELETED"] },
    },
    orderBy: [{ domainType: "asc" }, { createdAt: "asc" }],
    select: {
      domain: true,
      domainType: true,
      status: true,
      tenantSite: {
        select: {
          id: true,
          slug: true,
          displayName: true,
        },
      },
    },
  });

  if (!domainMatch) return null;

  return {
    tenantSiteId: domainMatch.tenantSite.id,
    tenantSlug: domainMatch.tenantSite.slug,
    tenantDisplayName: domainMatch.tenantSite.displayName,
    domain: domainMatch.domain,
    domainType: domainMatch.domainType,
    domainStatus: domainMatch.status,
  };
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

