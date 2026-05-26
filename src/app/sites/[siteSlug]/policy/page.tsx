import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";

export default async function PublicSitePolicyPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();

  const settings = preview.settings;
  if (!settings?.policyPageEnabled) notFound();

  const siteName = settings.siteDisplayName || settings.businessName || preview.tenantSite.displayName;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{settings.policyTitle || `${siteName} policy`}</h1>
            <Link href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}`} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Back to home
            </Link>
          </div>

          {settings.policyIntro ? <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{settings.policyIntro}</p> : null}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Cancellation and refund terms</p>
            <p className="mt-2">
              Full refund when cancelled at least {settings.cancellationFullRefundNoticeDays ?? 1} day(s) before the appointment.
            </p>
            <p>
              No refund within {settings.cancellationNoRefundWithinDays ?? 1} day(s) of appointment.
            </p>
            {settings.cancellationPolicyNote ? <p className="mt-2 whitespace-pre-wrap">{settings.cancellationPolicyNote}</p> : null}
          </div>

          {settings.policyBody ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{settings.policyBody}</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}