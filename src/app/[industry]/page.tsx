import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationsBlueprintSummary } from "@/components/industry/operations-blueprint-summary";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteCtaPanel } from "@/components/site-ui/site-cta-panel";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
import { SiteServiceGrid } from "@/components/site-ui/site-service-grid";
import { getBlueprintForTemplate } from "@/lib/industry/operations-repository";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type IndustryPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  if (!template) {
    notFound();
  }

  const blueprint = getBlueprintForTemplate(template.slug);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SiteHero
        eyebrow={template.category}
        title={template.defaultConfig.heroHeadline}
        subtitle={template.defaultConfig.heroSubheading}
        helperText="The demo is the starting point. Your customisations are saved to your own draft in this browser."
        actions={(
          <>
            <Link href={`/demo/${template.slug}`} target="_blank" rel="noreferrer" className={outlineButtonClass}>
              View demo site
            </Link>
            <Link href={`/demo/${template.slug}/customise`} className={secondaryButtonClass}>
              Customise my demo
            </Link>
            <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
              Start setup
            </Link>
          </>
        )}
      />

      <SimpleOfferCard industrySlug={template.slug} ctaLabel="Start setup" />

      <SiteSection title="What this website includes" eyebrow="Template highlights">
        <div className="grid gap-6 lg:grid-cols-2">
          <SiteCard title="Included features" subtitle="Professional local-business website foundation.">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {template.featureBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </SiteCard>
          <SiteCard title="Default services in demo" subtitle="These are editable in your customised draft.">
            <SiteServiceGrid services={template.defaultConfig.services} />
          </SiteCard>
        </div>
      </SiteSection>

      {blueprint ? (
        <OperationsBlueprintSummary
          blueprint={blueprint}
          variant="full"
          showPortalHighlights
          showAdminHighlights
          showLifecycle
        />
      ) : null}

      <SiteSection title="Domain and setup flow" eyebrow="After subscription">
        <div className="grid gap-6 lg:grid-cols-2">
          <SiteCard title="Domain options" subtitle="Choose the option that suits your business.">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>I already own a domain and can update nameservers/DNS</li>
              <li>I will buy my own domain and point it to you</li>
              <li>I want you to register/manage a domain for me</li>
            </ol>
            <Link href={`/${template.slug}/policy`} className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-900">
              View standard policy page
            </Link>
          </SiteCard>
          <SiteCard title="What happens next" subtitle="Simple managed onboarding process.">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>We review your demo customisation</li>
              <li>We confirm content and domain details</li>
              <li>We provision the site and connect your domain</li>
              <li>We host and manage it ongoing</li>
            </ol>
          </SiteCard>
        </div>
      </SiteSection>

      <SiteCtaPanel
        title="Ready to personalise your site?"
        subtitle="Open your industry demo, customise it, then send your setup request."
        primaryHref={`/demo/${template.slug}/customise`}
        primaryLabel="Customise my demo"
        secondaryHref={`/setup/${template.slug}`}
        secondaryLabel="Start setup"
      />
    </main>
  );
}

