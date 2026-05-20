import Link from "next/link";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type SimpleOfferCardProps = {
  industrySlug?: WebsiteTemplateSlug;
  ctaLabel?: string;
};

export function SimpleOfferCard({ industrySlug, ctaLabel }: SimpleOfferCardProps) {
  const offer = getWebsiteSubscriptionOffer();
  const href = industrySlug ? `/setup/${industrySlug}` : "/#industries";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
        One simple website subscription
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">No confusing packages</h2>
      <p className="mt-3 text-slate-600">
        The demo you customise is the site we build for you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Website setup fee</p>
          <p className="text-2xl font-semibold text-slate-900">£{offer.setupFeeGbp}</p>
          <p className="text-sm text-slate-600">one-off</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Monthly subscription</p>
          <p className="text-2xl font-semibold text-slate-900">£{offer.monthlyFeeGbp}</p>
          <p className="text-sm text-slate-600">per month</p>
        </div>
      </div>

      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-600">
        <li>Domain registration/management: £{offer.domainRegistrationFeeGbp} one-off if needed</li>
        <li>Optional WhatsApp add-on: +£{offer.whatsappAddonMonthlyFeeGbp}/month</li>
        <li>Email notifications included as standard</li>
      </ul>

      <Link
        href={href}
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        {ctaLabel ?? (industrySlug ? "Start setup" : "Choose your business type")}
      </Link>
    </section>
  );
}
