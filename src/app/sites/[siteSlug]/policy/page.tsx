import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import {
  DEFAULT_BOOKING_POLICY_BODY,
  DEFAULT_BOOKING_POLICY_TITLE,
  isCustomPolicyContent,
} from "@/lib/sites/default-booking-policy";
import { getPublicSiteBasePath } from "@/lib/sites/public-site-url";

export default async function PublicSitePolicyPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();
  const publicBasePath = await getPublicSiteBasePath(preview.tenantSite.slug);

  const settings = preview.settings;
  const siteName = settings?.siteDisplayName || settings?.businessName || preview.tenantSite.displayName;
  const hasCustomPolicy = isCustomPolicyContent({
    policyTitle: settings?.policyTitle,
    policyIntro: settings?.policyIntro,
    policyBody: settings?.policyBody,
    cancellationPolicyNote: settings?.cancellationPolicyNote,
  });
  const policyTitle = settings?.policyTitle || `${siteName} ${DEFAULT_BOOKING_POLICY_TITLE.toLowerCase()}`;
  const policyBody = settings?.policyBody || DEFAULT_BOOKING_POLICY_BODY;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{policyTitle}</h1>
            <Link href={publicBasePath || "/"} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Back to home
            </Link>
          </div>

          <p className="mt-3 text-sm text-slate-700">
            Please review this booking and cancellation policy before making a booking with {siteName}.
          </p>
          {settings?.policyIntro ? <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{settings.policyIntro}</p> : null}
          {!hasCustomPolicy ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              This business is currently using the standard default policy.
            </p>
          ) : null}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Cancellation and refund terms</p>
            <p className="mt-2">
              Full refund when cancelled at least {settings?.cancellationFullRefundNoticeDays ?? 1} day(s) before the appointment.
            </p>
            <p>
              No refund within {settings?.cancellationNoRefundWithinDays ?? 1} day(s) of appointment.
            </p>
            {settings?.cancellationPolicyNote ? <p className="mt-2 whitespace-pre-wrap">{settings.cancellationPolicyNote}</p> : null}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{policyBody}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
