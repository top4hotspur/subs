import Link from "next/link";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type SimpleOfferCardProps = {
  industrySlug?: WebsiteTemplateSlug;
  ctaLabel?: string;
  showCta?: boolean;
};

export function SimpleOfferCard({ industrySlug, ctaLabel, showCta = true }: SimpleOfferCardProps) {
  const offer = getWebsiteSubscriptionOffer();
  const href = industrySlug ? `/setup/${industrySlug}` : "/#industries";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        One simple website subscription
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">No confusing packages</h2>
      <p className="mt-3 max-w-3xl text-slate-600">
        No expensive tiers or missing features. Everything is included for one recurring monthly fee.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Setup fee</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">£{offer.setupFeeGbp}</p>
          <p className="text-sm text-slate-600">one-off</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">£{offer.monthlyFeeGbp}</p>
          <p className="text-sm text-slate-600">per month</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Domain service</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">£{offer.domainRegistrationFeeGbp}</p>
          <p className="text-sm text-slate-600">optional - only if you need us to register a new domain.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Go-live target</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Within a day</p>
          <p className="text-sm text-slate-600">Once domain name has been confirmed.</p>
        </div>
      </div>

      {showCta ? (
        <Link href={href} className={`mt-6 ${primaryButtonClass}`}>
          {ctaLabel ?? (industrySlug ? "Start setup" : "Choose your business type")}
        </Link>
      ) : null}
    </section>
  );
}


