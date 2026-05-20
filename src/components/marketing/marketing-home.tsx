import Link from "next/link";
import { listWebsiteTemplates } from "@/lib/sites/mock-repository";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";

const industryGroups: Array<{
  title: string;
  slugs: WebsiteTemplateSlug[];
}> = [
  {
    title: "Transport",
    slugs: ["taxi", "driving-instructors", "mobile-valeting"],
  },
  {
    title: "Hair, Beauty & Wellness",
    slugs: ["barbers", "hairdressers", "beauticians", "nail-salon", "massage"],
  },
  {
    title: "Home & Outdoor Services",
    slugs: ["window-cleaning", "dog-grooming", "cleaners", "gardeners"],
  },
];

export function MarketingHome() {
  const templateMap = new Map(
    listWebsiteTemplates().map((template) => [template.slug, template]),
  );

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          Subs / MyExperiment.club
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Subscription websites for local service businesses
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-600">
          Start with an industry demo, customise your own version, then subscribe.
          We handle setup, hosting, and ongoing management for you.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-2 sm:px-6 lg:px-8">
        <SimpleOfferCard ctaLabel="Choose your business type" />
      </section>

      <section id="industries" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">Choose your business type</h2>
        <p className="mt-2 text-slate-600">
          Browse our 12 launch industries and open the one that matches your business.
        </p>

        <div className="mt-8 space-y-8">
          {industryGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.slugs.map((slug) => {
                  const template = templateMap.get(slug);
                  if (!template) {
                    return null;
                  }

                  return (
                    <article key={template.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h4 className="text-xl font-semibold text-slate-900">{template.name}</h4>
                      <p className="mt-2 text-sm text-slate-600">{template.marketingSummary}</p>
                      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {template.featureBullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                      <Link
                        href={`/${template.slug}`}
                        className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                      >
                        Explore {template.category}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {["Choose your industry", "View and customise demo", "Request setup review", "We host and manage it"].map((step, index) => (
            <li key={step} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-sky-700">Step {index + 1}</p>
              <p className="mt-2 font-medium text-slate-900">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
