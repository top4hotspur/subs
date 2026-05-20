import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationsBlueprintSummary } from "@/components/industry/operations-blueprint-summary";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{template.category}</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">{template.defaultConfig.heroHeadline}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">{template.defaultConfig.heroSubheading}</p>
        <p className="mt-3 max-w-3xl text-slate-600">
          The demo is the starting point. Your customisations are saved to your own draft in this browser.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/demo/${template.slug}`} target="_blank" rel="noreferrer" className={outlineButtonClass}>
            View demo site
          </Link>
          <Link href={`/demo/${template.slug}/customise`} className={secondaryButtonClass}>
            Customise my demo
          </Link>
          <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
            Start setup
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <SimpleOfferCard industrySlug={template.slug} ctaLabel="Start setup" />
      </section>

      {blueprint ? (
        <section className="mt-8">
          <OperationsBlueprintSummary
            blueprint={blueprint}
            variant="full"
            showPortalHighlights
            showAdminHighlights
            showLifecycle
          />
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">What this website includes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
            {template.featureBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <h3 className="mt-6 text-lg font-semibold text-slate-900">Default services in demo</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
            {template.defaultConfig.services.map((service) => (
              <li key={service.id}>{service.name}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Domain options in setup</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-600">
            <li>I already own a domain and can update nameservers/DNS</li>
            <li>I will buy my own domain and point it to you</li>
            <li>I want you to register/manage a domain for me</li>
          </ol>
          <h3 className="mt-6 text-lg font-semibold text-slate-900">What happens after setup request</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
            <li>We review your demo customisation</li>
            <li>We confirm content and domain details</li>
            <li>We provision the site and connect your domain</li>
            <li>We host and manage it ongoing</li>
          </ol>
        </article>
      </section>
    </main>
  );
}
