import Link from "next/link";
import { HomeFaqAccordion } from "@/components/marketing/home-faq-accordion";
import { IndustryDemoCardCta } from "@/components/marketing/industry-demo-card";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteCtaPanel } from "@/components/site-ui/site-cta-panel";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
import { listWebsiteTemplates } from "@/lib/sites/mock-repository";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { outlineButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

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

const trustPoints = [
  "Full website included",
  "Mobile-friendly design",
  "Customer enquiry and booking flow support",
  "Business management tools",
  "Staffing and allocation tools",
  "Invoicing/payment tracking planned",
  "Customer feedback and review request support",
  "Email notifications included",
  "Optional WhatsApp add-on",
  "Hosting and ongoing management",
];

const faqs = [
  {
    q: "Is this a cut-down package?",
    a: "No. The demo you customise is the site we set up and manage for you.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. You can use an existing domain, buy one yourself, or ask us to register/manage it.",
  },
  {
    q: "What if I do not have a logo?",
    a: "No problem. The site uses a polished text-brand fallback until you provide a logo.",
  },
  {
    q: "Are email notifications included?",
    a: "Yes. Email notifications are included as standard.",
  },
  {
    q: "Can I add WhatsApp?",
    a: "Yes. WhatsApp communication can be added as an optional +GBP10/month add-on.",
  },
  {
    q: "Can I customise the demo before subscribing?",
    a: "Yes. You can customise first, then start setup when ready.",
  },
];

export function MarketingHome() {
  const templateMap = new Map(
    listWebsiteTemplates().map((template) => [template.slug, template]),
  );

  return (
    <main className="bg-slate-100">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <SiteHero
          eyebrow="Subs / MyExperiment.club"
          title="Subscription websites for local service businesses"
          subtitle="Demo first, customise your version, then request setup. One simple website subscription with ongoing management."
          helperText="GBP149 setup + GBP30/month. Email included. Optional WhatsApp add-on +GBP10/month."
          actions={(
            <>
              <Link href="#industries" className={secondaryButtonClass}>
                Choose your business type
              </Link>
              <Link href="/demo/barbers" className={outlineButtonClass}>
                View example demo
              </Link>
              <Link href="#how-it-works" className={outlineButtonClass}>
                How it works
              </Link>
            </>
          )}
        />

        <SimpleOfferCard ctaLabel="Choose your business type" />

        <SiteSection id="industries" title="Choose your business type" eyebrow="12 launch industries">
          <p className="text-slate-600">
            Browse by industry, open the demo, customise your version, and move to setup when ready.
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
                      <SiteCard key={template.slug} title={template.name} subtitle={template.marketingSummary}>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                          {template.featureBullets.slice(0, 3).map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                        <IndustryDemoCardCta industrySlug={template.slug} />
                      </SiteCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SiteSection>

        <SiteSection id="how-it-works" title="How it works" eyebrow="Simple journey">
          <ol className="grid gap-4 md:grid-cols-5">
            {[
              "Choose your business type",
              "View the demo",
              "Customise your demo",
              "Start setup",
              "We configure and host the site",
            ].map((step, index) => (
              <li key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{step}</p>
              </li>
            ))}
          </ol>
        </SiteSection>

        <SiteSection title="Everything your business website needs" eyebrow="Trust and capability">
          <p className="text-slate-600">
            A simple managed website package with the tools local service businesses need to get enquiries, bookings,
            updates and repeat customers.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-700">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  ?
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </SiteSection>

        <SiteSection title="Frequently asked questions" eyebrow="FAQ">
          <HomeFaqAccordion items={faqs} />
        </SiteSection>

        <SiteCtaPanel
          title="Ready to see your website live direction?"
          subtitle="Choose your industry, customise your demo, and start setup when you are happy."
          primaryHref="#industries"
          primaryLabel="Choose your business type"
          secondaryHref="/demo/taxi"
          secondaryLabel="View example demo"
        />
      </div>
    </main>
  );
}
