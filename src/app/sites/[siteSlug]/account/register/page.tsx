import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteCustomerAccountForm } from "@/components/sites/site-customer-account-forms";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";

export default async function CustomerAccountRegisterPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) notFound();
  const publicBasePath = await getPublicSiteBasePath(site.slug);
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{site.displayName}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Create customer account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create a simple account for this business so future bookings can appear in one place.
        </p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-slate-600">Loading registration...</p>}>
            <SiteCustomerAccountForm siteSlug={site.slug} mode="register" publicBasePath={publicBasePath} />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-teal-700 underline" href={buildPublicSitePath(publicBasePath, "account/login")}>
            Log in here
          </Link>.
        </p>
      </section>
    </main>
  );
}
