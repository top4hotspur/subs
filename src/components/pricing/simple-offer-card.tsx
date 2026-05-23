import Link from "next/link";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type SimpleOfferCardProps = {
  industrySlug?: WebsiteTemplateSlug;
  ctaLabel?: string;
};

export function SimpleOfferCard({ industrySlug, ctaLabel }: SimpleOfferCardProps) {
  const offer = getWebsiteSubscriptionOffer();
  const href = industrySlug ? `/setup/${industrySlug}` : "/#industries";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        One simple website subscription
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">No confusing packages</h2>
      <p className="mt-3 max-w-3xl text-slate-600">
        The demo you customise is the site we build for you. Everything starts with one professional managed offer.
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
          <p className="text-sm text-slate-600">only if we register/manage</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Go-live target</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Within a day</p>
          <p className="text-sm text-slate-600">once details and domain are ready</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">Email notifications are included. More features are being added all the time.</p>

      <Link href={href} className={`mt-6 ${primaryButtonClass}`}>
        {ctaLabel ?? (industrySlug ? "Start setup" : "Choose your business type")}
      </Link>
    </section>
  );
}

