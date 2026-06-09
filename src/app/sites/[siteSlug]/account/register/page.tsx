import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteCustomerAccountForm } from "@/components/sites/site-customer-account-forms";
import { TenantSiteShell } from "@/components/sites/tenant-site-shell";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

export default async function CustomerAccountRegisterPage({ params }: { params: Promise<{ siteSlug: string }> }) {
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
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{siteName}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Create customer account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a simple account for this business so future bookings can appear in one place.
        </p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-slate-600">Loading registration...</p>}>
            <SiteCustomerAccountForm siteSlug={preview.tenantSite.slug} mode="register" publicBasePath={publicBasePath} />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-teal-700 underline" href={buildPublicSitePath(publicBasePath, "account/login")}>
            Log in here
          </Link>.
        </p>
      </section>
    </TenantSiteShell>
  );
}
