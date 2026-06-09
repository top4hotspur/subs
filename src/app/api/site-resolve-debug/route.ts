import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import {
  getLiveTenantSiteByDomainHost,
  getTenantDomainBlockReason,
  getTenantSiteByDomainHost,
  normalizeHost,
} from "@/lib/sites/tenant-resolver";

function extractHost(value: string | null): string {
  if (!value) return "";
  return value.trim().toLowerCase().split(":")[0]?.replace(/\.$/, "") ?? "";
}

function parsePlatformHosts(): Set<string> {
  const hosts = new Set([
    "localhost",
    "127.0.0.1",
    "::1",
    "myexperiment.club",
    "www.myexperiment.club",
  ]);
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const host = extractHost(new URL(configured).host);
      if (host) {
        hosts.add(host);
        hosts.add(host.startsWith("www.") ? host.slice(4) : `www.${host}`);
      }
    } catch {
      const host = extractHost(configured.replace(/^[a-z]+:\/\//i, "").split("/")[0] ?? "");
      if (host) hosts.add(host);
    }
  }
  return hosts;
}

function isPlatformHost(host: string): boolean {
  if (!host) return true;
  if (parsePlatformHosts().has(host)) return true;
  return host.endsWith(".amplifyapp.com");
}

function routeWouldRewriteTo(tenantSlug: string | null | undefined, path: string): string | null {
  if (!tenantSlug) return null;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/") return `/tenant-domain-runtime -> /sites/${tenantSlug}`;
  if (normalizedPath.toLowerCase() === `/sites/${tenantSlug.toLowerCase()}`) {
    return `/tenant-domain-runtime/sites/${tenantSlug} -> /`;
  }
  return `/tenant-domain-runtime${normalizedPath} -> /sites/${tenantSlug}${normalizedPath}`;
}

export async function GET(request: NextRequest) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const testHost = request.headers.get("x-test-site-host");
  const queryHost = request.nextUrl.searchParams.get("host");
  const queryPath = request.nextUrl.searchParams.get("path") ?? "/";
  const receivedHost = queryHost?.trim() || testHost?.trim() || forwardedHost || host || "";
  const normalizedHost = normalizeHost(receivedHost);
  const platformHost = isPlatformHost(normalizedHost);
  const match = await getTenantSiteByDomainHost(receivedHost, { includeUnavailable: true });
  const liveMatch = await getLiveTenantSiteByDomainHost(receivedHost);
  const blockReason = platformHost ? "PLATFORM_HOST" : getTenantDomainBlockReason(match);

  return NextResponse.json({
    ok: true,
    inputHost: queryHost ?? null,
    hostReceived: receivedHost || null,
    normalizedHost: normalizedHost || null,
    path: queryPath,
    isPlatformHost: platformHost,
    matched: Boolean(match),
    tenantSiteId: match?.tenantSiteId ?? null,
    tenantSlug: match?.tenantSlug ?? null,
    domainStatus: match?.domainStatus ?? null,
    dnsStatus: match?.dnsStatus ?? null,
    sslStatus: match?.sslStatus ?? null,
    tenantLifecycleStatus: match?.siteStatus ?? null,
    tenantProvisioningStatus: match?.provisioningStatus ?? null,
    tenantSubscriptionStatus: match?.subscriptionStatus ?? null,
    matchedDomain: match?.domain ?? null,
    matchedDomainType: match?.domainType ?? null,
    wouldRender: Boolean(liveMatch),
    blockReason,
    rewriteTarget: liveMatch ? routeWouldRewriteTo(liveMatch.tenantSlug, queryPath) : null,
    routeWouldRewriteTo: liveMatch ? routeWouldRewriteTo(liveMatch.tenantSlug, queryPath) : null,
  });
}
