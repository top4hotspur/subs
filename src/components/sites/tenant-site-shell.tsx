import Link from "next/link";
import type { ReactNode } from "react";
import { SiteCookieNotice } from "@/components/site-ui/site-cookie-notice";
import { buildPublicSitePath } from "@/lib/sites/public-site-url";

type TenantSiteShellProps = {
  siteSlug: string;
  siteName: string;
  publicBasePath: string;
  domainPrimary?: string | null;
  phone?: string | null;
  email?: string | null;
  children: ReactNode;
};

function platformAbsolutePath(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://myexperiment.club";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function TenantSiteShell({
  siteSlug,
  siteName,
  publicBasePath,
  domainPrimary,
  phone,
  email,
  children,
}: TenantSiteShellProps) {
  const bookingHref = buildPublicSitePath(publicBasePath, "#services");
  const contactHref = buildPublicSitePath(publicBasePath, "contact");
  const customerAccountHref = buildPublicSitePath(publicBasePath, "account");
  const cookiesHref = buildPublicSitePath(publicBasePath, "cookies");
  const privacyHref = buildPublicSitePath(publicBasePath, "privacy");
  const policyHref = buildPublicSitePath(publicBasePath, "policy");
  const isCustomDomainRender = publicBasePath === "";
  const siteAdminHref = isCustomDomainRender
    ? "/site-admin"
    : platformAbsolutePath(`/site-admin/${encodeURIComponent(siteSlug)}`);
  const staffLoginHref = isCustomDomainRender
    ? "/site-staff"
    : platformAbsolutePath(`/site-staff/${encodeURIComponent(siteSlug)}`);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-4 sm:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">{siteName}</p>
              <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label={`${siteName} navigation`}>
                <Link href={publicBasePath || "/"} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900 hover:bg-slate-50">Home</Link>
                <Link href={bookingHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900 hover:bg-slate-50">Services</Link>
                <Link href={bookingHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900 hover:bg-slate-50">Book now</Link>
                <Link href={contactHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900 hover:bg-slate-50">Contact</Link>
                <Link href={customerAccountHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900 hover:bg-slate-50">Customer login</Link>
              </nav>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-8">{children}</div>

          <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-xs text-slate-600 sm:px-8">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">{siteName}</p>
              {domainPrimary ? <p className="mt-1 text-xs text-slate-500">{domainPrimary}</p> : null}
            </div>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
              {phone ? <span>Phone: {phone}</span> : null}
              {email ? <span>Email: {email}</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={customerAccountHref} className="hover:text-slate-900">Customer account</Link>
              <Link href={privacyHref} className="hover:text-slate-900">Privacy Policy</Link>
              <Link href={cookiesHref} className="hover:text-slate-900">Cookie Policy</Link>
              <Link href={policyHref} className="hover:text-slate-900">Terms / Policies</Link>
              <span className="mx-1 text-slate-300">|</span>
              <Link href={staffLoginHref} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Staff login</Link>
              <Link href={siteAdminHref} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Business admin login</Link>
            </div>
          </footer>
        </section>
      </div>
      <SiteCookieNotice siteSlug={siteSlug} publicBasePath={publicBasePath} />
    </main>
  );
}
