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

function shouldBypassTenantRewrite(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/tenant-domain-runtime")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = extractHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));

  if (!isPlatformHost(host) && !shouldBypassTenantRewrite(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/tenant-domain-runtime${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/site-admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req });
    const email = token?.email?.toString().trim().toLowerCase();
    const isPlatformRole = token?.roleType === "PLATFORM_ADMIN";
    if (!email || !isPlatformRole || !parsePlatformAdminEmails().includes(email)) {
      return redirectToLogin(req, "/admin/login");
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/site-admin")) {
    const token = await getToken({ req });
    if (token?.roleType !== "SITE_ADMIN") {
      return redirectToLogin(req, "/site-admin/login");
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
