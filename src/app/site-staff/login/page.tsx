import Link from "next/link";
import { SiteStaffLoginForm } from "@/components/site-staff/site-staff-login-form";
import { TenantSiteShell } from "@/components/sites/tenant-site-shell";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type SiteStaffLoginPageProps = {
  searchParams: Promise<{
    siteSlug?: string;
    callbackUrl?: string;
  }>;
};

function inferSiteSlug(callbackUrl: string | undefined): string {
  if (!callbackUrl) return "";
  try {
    const normalized = callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
    const path = normalized.split("?")[0] ?? "";
    const match = path.match(/^\/site-staff\/([^/]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

export default async function SiteStaffLoginPage({ searchParams }: SiteStaffLoginPageProps) {
  const params = await searchParams;
  const initialSiteSlug = params.siteSlug?.trim() || inferSiteSlug(params.callbackUrl);
  const preview = initialSiteSlug ? await getCustomerSitePreviewDataBySlug(initialSiteSlug) : null;
  const publicBasePath = preview ? await getPublicSiteBasePath(preview.tenantSite.slug) : "";
  const siteName =
    preview?.settings?.siteDisplayName ||
    preview?.settings?.businessName ||
    preview?.tenantSite.displayName ||
    (initialSiteSlug ? initialSiteSlug : "your website");

  const card = (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Staff appointment view</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{siteName}</h1>
      <p className="mt-2 text-sm text-slate-600">
        This area is for staff members who need to see the shared appointment diary for the business.
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Ask the business owner/admin to generate or reset your staff password if you do not have one yet.
      </p>
      {preview?.tenantSite.slug ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={buildPublicSitePath(publicBasePath, "")}
            className="rounded-md border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Preview public site
          </Link>
        </div>
      ) : null}
      <SiteStaffLoginForm initialSiteSlug={initialSiteSlug} callbackUrl={params.callbackUrl || ""} />
    </section>
  );

  if (preview) {
    return (
      <TenantSiteShell
        siteSlug={preview.tenantSite.slug}
        siteName={siteName}
        publicBasePath={publicBasePath}
        domainPrimary={preview.tenantSite.domainPrimary}
        phone={preview.settings?.phone}
        email={preview.settings?.email}
      >
        {card}
      </TenantSiteShell>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      {card}
    </main>
  );
}
