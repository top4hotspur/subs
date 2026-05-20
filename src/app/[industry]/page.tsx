import Link from "next/link";
import { notFound } from "next/navigation";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">{template.category}</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">{template.defaultConfig.heroHeadline}</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">{template.defaultConfig.heroSubheading}</p>
        <p className="mt-3 max-w-3xl text-slate-600">
          This is the full site offer, not a cut-down package. Customise the demo first,
          email notifications are included, WhatsApp is optional, and domain choices are confirmed in setup.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/demo/${template.slug}`} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">See the demo</Link>
          <Link href={`/demo/${template.slug}/customise`} className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">Customise this demo</Link>
          <Link href={`/setup/${template.slug}`} className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">Start setup</Link>
        </div>
      </section>

      <section className="mt-8">
        <SimpleOfferCard industrySlug={template.slug} ctaLabel="Start setup" />
      </section>

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
