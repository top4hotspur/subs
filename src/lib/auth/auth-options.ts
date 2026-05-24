import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateCustomerSiteAdminUser } from "@/lib/sites/customer-site-admin-user-repository";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Platform admin",
      id: "platform-admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        accessCode: { label: "Access code", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const accessCode = credentials?.accessCode?.toString();

        if (!email || !accessCode) return null;

        const allowlist = parsePlatformAdminEmails();
        const expectedCode = process.env.PLATFORM_ADMIN_ACCESS_CODE?.trim();
        if (!expectedCode) return null;
        if (!allowlist.includes(email)) return null;
        if (accessCode !== expectedCode) return null;

        return { id: email, email, name: email, roleType: "PLATFORM_ADMIN" };
      },
    }),
    CredentialsProvider({
      name: "Site admin",
      id: "site-admin-credentials",
      credentials: {
        siteSlug: { label: "Site slug", type: "text" },
        email: { label: "Email", type: "email" },
        accessCode: { label: "Access code", type: "password" },
      },
      async authorize(credentials) {
        const siteSlug = credentials?.siteSlug?.toString().trim();
        const email = credentials?.email?.toString().trim().toLowerCase();
        const accessCode = credentials?.accessCode?.toString();
        if (!siteSlug || !email || !accessCode) return null;

        const auth = await authenticateCustomerSiteAdminUser({
          siteSlug,
          email,
          accessCode,
        });
        if (!auth) return null;

        return {
          id: auth.siteAdminUserId,
          email: auth.email,
          name: auth.displayName ?? auth.email,
          roleType: "SITE_ADMIN",
          tenantSiteId: auth.tenantSiteId,
          tenantSlug: auth.tenantSlug,
          siteAdminUserId: auth.siteAdminUserId,
          siteAdminRole: auth.siteAdminRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roleType = (user as { roleType?: "PLATFORM_ADMIN" | "SITE_ADMIN" }).roleType;
        token.tenantSiteId = (user as { tenantSiteId?: string }).tenantSiteId;
        token.tenantSlug = (user as { tenantSlug?: string }).tenantSlug;
        token.siteAdminUserId = (user as { siteAdminUserId?: string }).siteAdminUserId;
        token.siteAdminRole = (user as { siteAdminRole?: "OWNER" | "ADMIN" }).siteAdminRole;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.roleType = token.roleType;
      session.user.tenantSiteId = token.tenantSiteId;
      session.user.tenantSlug = token.tenantSlug;
      session.user.siteAdminUserId = token.siteAdminUserId;
      session.user.siteAdminRole = token.siteAdminRole;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
};
