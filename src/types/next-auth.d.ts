import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      roleType?: "PLATFORM_ADMIN" | "SITE_ADMIN";
      tenantSiteId?: string;
      tenantSlug?: string;
      siteAdminUserId?: string;
      siteAdminRole?: "OWNER" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleType?: "PLATFORM_ADMIN" | "SITE_ADMIN";
    tenantSiteId?: string;
    tenantSlug?: string;
    siteAdminUserId?: string;
    siteAdminRole?: "OWNER" | "ADMIN";
  }
}

