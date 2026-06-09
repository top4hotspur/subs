import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyExperiment.club | Managed Subscription Websites",
  description:
    "Professional, feature rich websites for local service businesses with cheap monthly fee, managed setup, and ongoing support.",
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = extractHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  const showPlatformChrome = isPlatformHost(host);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        {showPlatformChrome ? <SiteHeader /> : null}
        {children}
        {showPlatformChrome ? <SiteFooter /> : null}
      </body>
    </html>
  );
}
