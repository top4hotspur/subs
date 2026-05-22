import { withAuth } from "next-auth/middleware";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export default withAuth({
  callbacks: {
    authorized({ token, req }) {
      if (req.nextUrl.pathname.startsWith("/admin/login")) {
        return true;
      }
      const email = token?.email?.toString().trim().toLowerCase();
      if (!email) return false;
      return parsePlatformAdminEmails().includes(email);
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
