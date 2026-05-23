import Link from "next/link";
import { HomeFaqAccordion } from "@/components/marketing/home-faq-accordion";
import { IndustryCategoryBrowser } from "@/components/marketing/industry-category-browser";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
import { SiteCtaPanel } from "@/components/site-ui/site-cta-panel";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
import { listWebsiteTemplates } from "@/lib/sites/mock-repository";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { outlineButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

const industryGroups: Array<{
  title: string;
  description: string;
  slugs: WebsiteTemplateSlug[];
}> = [
  {
    title: "Hair, Beauty & Wellness",
    slugs: ["barbers", "hairdressers", "beauticians", "nail-salon", "massage"],
    description: "Appointment-led businesses with service pricing and slot booking.",
  },
  {
    title: "Home Services",
    slugs: ["window-cleaning", "cleaners", "gardeners", "dog-grooming", "mobile-valeting"],
    description: "Quote and job-request flows for property and mobile services.",
  },
  {
    title: "Transport",
    slugs: ["taxi", "bus-hire"],
    description: "Route and group-transport request flows for local operators.",
  },
  {
    title: "Learning",
    slugs: ["driving-instructors", "tutors"],
    description: "Lesson and tutoring websites with enquiry and booking journeys.",
  },
];

const trustPoints = [
  {
    title: "Industry-specific website",
    detail: "A modern, mobile-friendly site tailored to your trade, not a generic template.",
  },
  {
    title: "Booking and enquiry flows",
    detail: "Turn visitors into customers with appointment, quote or request flows built around your services.",
  },
  {
    title: "Business tools included",
    detail: "Manage services, prices, staff, rota, availability and customer requests in one place.",
  },
  {
    title: "Managed setup and hosting",
    detail: "We help with setup, hosting and domain guidance so you are not left handling technical overhead.",
  },
  {
    title: "One simple package",
    detail: "No confusing tiers. One full-feature website subscription for one monthly price.",
  },
  {
    title: "Lower-cost alternative",
    detail: "Avoid piecing together separate booking tools, website maintenance and agency support.",
  },
  {
    title: "Fast launch target",
    detail: "Once your details and domain are ready, we aim to get your site live within a day.",
  },
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
          title="Managed websites and booking tools for local service businesses"
          subtitle="Choose your industry, preview a working demo, and get a professional website with booking/request tools, customer features and ongoing support — all in one simple monthly package."
          helperText="£149 setup + £30/month. Full managed website included. Live-site target within a day once details and domain are ready."
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

        <SiteSection title="More than just a website. A complete toolkit for your service business.">
          <p className="text-slate-600">
            Get a professional, fully managed online presence designed around how your business actually works. We handle setup, hosting and ongoing maintenance so you can focus on customers, bookings and day-to-day service.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{point.title}</p>
                <p className="mt-1 text-sm text-slate-600">{point.detail}</p>
              </div>
            ))}
          </div>
        </SiteSection>

        <SimpleOfferCard showCta={false} />

        <SiteSection id="industries" title="Choose your business type">
          <p className="text-slate-600">
            Start with a category, then pick your industry demo and continue to your sales page.
          </p>
          <div className="mt-6">
            <IndustryCategoryBrowser groups={industryGroups} templateMap={templateMap} />
          </div>
        </SiteSection>

        <SiteSection id="how-it-works" title="How it works">
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
