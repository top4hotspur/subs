import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequestForm } from "@/components/setup/setup-request-form";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type SetupIndustryPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function SetupIndustryPage({ params }: SetupIndustryPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  if (!template) {
    notFound();
  }

  const offer = getWebsiteSubscriptionOffer();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Order now</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{template.name.replace(/\s+websites?$/i, " website")}</h1>
        <p className="mt-3 text-slate-600">
          One full website offer: £{offer.setupFeeGbp} setup, £{offer.monthlyFeeGbp}/month,
          with optional domain registration/management only where needed.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Your subscriber site is created as a clean setup. Demo content is not copied automatically.
        </p>
        <p className="mt-2 text-sm text-slate-600">Place your order today. We&apos;ll confirm your domain details and payment setup before your site goes live.</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
          <Link href={`/demo/${template.slug}`} className="text-sky-700 hover:text-sky-900">
            Back to demo site
          </Link>
          <Link href="/contact" className="text-sky-700 hover:text-sky-900">
            Contact us
          </Link>
        </div>
      </section>

      <SetupRequestForm template={template} />
    </main>
  );
}
