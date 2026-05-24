import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export type SiteAdminSessionContext = {
  siteAdminUserId: string;
  tenantSiteId: string;
  tenantSlug: string;
  siteAdminRole: "OWNER" | "ADMIN";
  email: string;
};

export async function getSiteAdminSessionContext(): Promise<SiteAdminSessionContext | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.roleType !== "SITE_ADMIN") return null;

  const siteAdminUserId = session.user.siteAdminUserId?.trim();
  const tenantSiteId = session.user.tenantSiteId?.trim();
  const tenantSlug = session.user.tenantSlug?.trim();
  const siteAdminRole = session.user.siteAdminRole;
  const email = session.user.email?.trim().toLowerCase();
  if (!siteAdminUserId || !tenantSiteId || !tenantSlug || !siteAdminRole || !email) {
    return null;
  }

  return {
    siteAdminUserId,
    tenantSiteId,
    tenantSlug,
    siteAdminRole,
    email,
  };
}

export async function isSiteAdminSessionForSlug(siteSlug: string): Promise<boolean> {
  const context = await getSiteAdminSessionContext();
  if (!context) return false;
  return context.tenantSlug === siteSlug;
}

