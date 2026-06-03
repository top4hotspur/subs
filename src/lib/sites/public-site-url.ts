import { headers } from "next/headers";
import { getLiveTenantSiteByDomainHost } from "@/lib/sites/tenant-resolver";

export function buildPreviewSiteBasePath(siteSlug: string): string {
  return `/sites/${encodeURIComponent(siteSlug)}`;
}

export function buildPublicSitePath(basePath: string, path = ""): string {
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const normalizedPath = path ? `/${path.replace(/^\//, "")}` : "";
  return `${normalizedBase}${normalizedPath}` || "/";
}

export async function getPublicSiteBasePath(siteSlug: string): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "";
  const match = await getLiveTenantSiteByDomainHost(host);
  if (match?.tenantSlug === siteSlug) return "";
  return buildPreviewSiteBasePath(siteSlug);
}
