import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteCustomerAccountForm } from "@/components/sites/site-customer-account-forms";
import { getTenantSiteBySlug } from "@/lib/sites/tenant-resolver";

export default async function CustomerAccountLoginPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const site = await getTenantSiteBySlug(siteSlug);
  if (!site) notFound();
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{site.displayName}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Customer login</h1>
        <p className="mt-2 text-sm text-slate-600">Log in to view your bookings for this business.</p>
        <div className="mt-5">
          <Suspense fallback={<p className="text-sm text-slate-600">Loading login...</p>}>
            <SiteCustomerAccountForm siteSlug={site.slug} mode="login" />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          No account yet?{" "}
          <Link className="font-semibold text-teal-700 underline" href={`/sites/${encodeURIComponent(site.slug)}/account/register`}>
            Create one here
          </Link>.
        </p>
      </section>
    </main>
  );
}
