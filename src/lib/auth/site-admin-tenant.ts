import { getSiteAdminSessionContext } from "@/lib/auth/site-admin";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

export type SiteAdminTenantResolution =
  | { ok: true; tenantSiteId: string; tenantSlug: string }
  | { ok: false; error: "FORBIDDEN" | "SITE_NOT_FOUND"; status: 403 | 404 };

export async function resolveSiteAdminTenantBySlug(
  siteSlug: string,
): Promise<SiteAdminTenantResolution> {
  const session = await getSiteAdminSessionContext();
  if (!session) return { ok: false, error: "FORBIDDEN", status: 403 };

  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) return { ok: false, error: "SITE_NOT_FOUND", status: 404 };

  if (session.tenantSiteId !== site.id || session.tenantSlug !== site.slug) {
    return { ok: false, error: "FORBIDDEN", status: 403 };
  }

  return { ok: true, tenantSiteId: site.id, tenantSlug: site.slug };
}

