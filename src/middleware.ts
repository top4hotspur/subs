import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function redirectToLogin(req: NextRequest, loginPath: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/site-admin/login")) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (pathname.startsWith("/admin")) {
    const email = token?.email?.toString().trim().toLowerCase();
    const isPlatformRole = token?.roleType === "PLATFORM_ADMIN";
    if (!email || !isPlatformRole || !parsePlatformAdminEmails().includes(email)) {
      return redirectToLogin(req, "/admin/login");
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/site-admin")) {
    if (token?.roleType !== "SITE_ADMIN") {
      return redirectToLogin(req, "/site-admin/login");
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/site-admin/:path*"],
};

