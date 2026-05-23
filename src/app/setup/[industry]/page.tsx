import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationsBlueprintSummary } from "@/components/industry/operations-blueprint-summary";
import { SetupRequestForm } from "@/components/setup/setup-request-form";
import { SiteSettingsSummary } from "@/components/sites/site-settings-summary";
import { getBlueprintForTemplate } from "@/lib/industry/operations-repository";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { buildDefaultCustomerSiteSettings } from "@/lib/sites/default-site-settings";
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
  const blueprint = getBlueprintForTemplate(template.slug);
  const siteSettings = buildDefaultCustomerSiteSettings(template);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Setup Request</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{template.name}</h1>
        <p className="mt-3 text-slate-600">
          One full website offer: £{offer.setupFeeGbp} setup, £{offer.monthlyFeeGbp}/month,
          with optional domain registration/management only where needed.
        </p>
        <Link href={`/demo/${template.slug}/customise`} className="mt-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
          Back to customisation
        </Link>
      </section>

      {blueprint ? (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">Your site can support this type of workflow</h2>
          <OperationsBlueprintSummary
            blueprint={blueprint}
            variant="compact"
            showPortalHighlights
            showAdminHighlights
            showLifecycle={false}
          />
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Your website will include</h2>
        <SiteSettingsSummary settings={siteSettings} />
        <p className="mt-3 text-sm text-slate-600">
          Logo is optional and text-brand fallback works by default. Pages and sections can be adjusted during setup.
          Email notifications are included, and legal pages can be enabled/hidden and edited later.
          Customer/business login areas are future admin-controlled features.
        </p>
      </section>

      <SetupRequestForm template={template} />
    </main>
  );
}
