import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

        return { id: email, email, name: email };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
};
