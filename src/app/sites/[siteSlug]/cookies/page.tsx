import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";

export default async function PublicSiteCookiePolicyPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
            <Link
              href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Back to home
            </Link>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>We use essential cookies required for basic site functionality.</p>
            <p>
              Optional analytics, booking, and payment related cookies may be used when those features are enabled.
            </p>
            <p>
              By continuing to use this site after accepting the cookie notice, you agree to this cookie policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

