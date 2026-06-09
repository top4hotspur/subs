import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteCustomerAccountForm } from "@/components/sites/site-customer-account-forms";
import { TenantSiteShell } from "@/components/sites/tenant-site-shell";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

export default async function CustomerAccountLoginPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();
  const publicBasePath = await getPublicSiteBasePath(preview.tenantSite.slug);
  const siteName =
    preview.settings?.siteDisplayName ||
    preview.settings?.businessName ||
    preview.tenantSite.displayName;

  return (
    <TenantSiteShell
      siteSlug={preview.tenantSite.slug}
      siteName={siteName}
      publicBasePath={publicBasePath}
      domainPrimary={preview.tenantSite.domainPrimary}
      phone={preview.settings?.phone}
      email={preview.settings?.email}
    >
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{siteName}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Customer login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Log in to view your bookings for this business. Your customer account is separate from staff and business-admin access.
        </p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-slate-600">Loading login...</p>}>
            <SiteCustomerAccountForm siteSlug={preview.tenantSite.slug} mode="login" publicBasePath={publicBasePath} />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          No account yet?{" "}
          <Link className="font-semibold text-teal-700 underline" href={buildPublicSitePath(publicBasePath, "account/register")}>
            Create one here
          </Link>.
        </p>
      </section>
    </TenantSiteShell>
  );
}
