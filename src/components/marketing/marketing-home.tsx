import Link from "next/link";
import { HomeFaqAccordion } from "@/components/marketing/home-faq-accordion";
import { IndustryCategoryBrowser } from "@/components/marketing/industry-category-browser";
import { SimpleOfferCard } from "@/components/pricing/simple-offer-card";
import { SiteCtaPanel } from "@/components/site-ui/site-cta-panel";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
import { listWebsiteTemplates } from "@/lib/sites/mock-repository";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

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

const leadTrustPoint = {
  title: "Includes ALL business tools",
  detail: "Manage services, prices, staff, rota, availability and customer requests in one place.",
};

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
    title: "Managed setup and hosting",
    detail: "We set up, host and manage your site, leaving you to focus on growing your business.",
  },
  {
    title: "Customer communication",
    detail:
      "Stay in touch with customers directly. Automatically confirm bookings, email special offers etc all from your brand new website.",
  },
  {
    title: "Lower-cost alternative",
    detail: "Avoid piecing together separate booking tools, website maintenance and agency support.",
  },
  {
    title: "Fast launch",
    detail:
      "From sign up, your site should be live and ready to take orders within a day!",
  },
];

const faqs = [
  {
    q: "Do I have to pay extra to unlock more features?",
    a: "No, we keep things entirely simple. We offer one full package for everyone, with no confusing feature tiers. Your subscription includes all the business management tools, booking flows, and staff scheduling features we offer.",
  },
  {
    q: "Do I need to buy my own domain name?",
    a: "You have options. If you already own a domain, you can point it to us at no extra domain fee. If you need a new one, we can register and manage it for you for a flat GBP49 fee.",
  },
  {
    q: "Do I have to pay before seeing what my site looks like?",
    a: "Not at all. You can choose your industry, preview a realistic demo site, and customise your core details before you submit a setup request or pay.",
  },
  {
    q: "What if my business doesn't have a professional logo yet?",
    a: "No problem. The site uses a polished text-brand fallback until you provide a logo. You can easily update it later whenever you are ready.",
  },
  {
    q: "Who handles the hosting and technical updates?",
    a: "We do. Your GBP30 monthly subscription covers the hosting, setup support, and ongoing platform management. We manage the tech so you can stay focused on running your business.",
  },
  {
    q: "Does the website actually handle my customer bookings?",
    a: "Yes, this is not just a brochure website. Your site includes industry-specific booking or quote flows, and standard email notifications to keep your customers updated.",
  },
  {
    q: "Can I manage my staff and their schedules on the platform?",
    a: "Yes. As the site owner, you have access to business admin features where you can set up staff profiles, assign roles, and manage rotas, breaks, and closures.",
  },
  {
    q: "Can customers choose which staff member they book with?",
    a: "Yes, the platform includes a customer-selectable staff toggle, allowing your clients to book with their preferred barber, stylist, or service provider.",
  },
  {
    q: "Does the platform handle gift vouchers?",
    a: "Yes, optional gift vouchers are supported. You can configure the settings in your admin area, and there is a specific workflow for checking and redeeming vouchers when customers use them.",
  },
  {
    q: "What happens if a customer books over the phone or walks in?",
    a: "The platform supports manual and telephone bookings, so you can easily add those appointments to your digital schedule alongside the online requests.",
  },
  {
    q: "Do I need to be a tech expert to make changes to my services or pricing?",
    a: "Not at all. You have access to a simple services, products, and pricing editor where you can easily update your offerings, including setting different prices for different staff roles.",
  },
  {
    q: "What if I get stuck?",
    a: "Support is on hand to help you get up and running as quickly as possible. We guide you through setup, domain questions, and the key information needed to get your site live.",
  },
  {
    q: "How do payment processors work?",
    a: "You can use an existing payment processor, ask us to help you set one up, or begin by recording payments manually until you are ready. The aim is to make the transition as smooth as possible without forcing you into one provider.",
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
          subtitle="Choose your industry, preview a working demo, and get a professional website with booking/request tools, customer features and ongoing support - all in one simple monthly package."
          helperText="GBP149 setup + GBP30/month. Full managed website included. Live-site target within a day once domain name has been confirmed."
          actions={(
            <>
              <Link href="#industries" className={primaryButtonClass}>
                Choose your business type
              </Link>
              <Link href="/demo/barbers" className={`${secondaryButtonClass} !text-slate-950`}>
                View example demo
              </Link>
              <Link href="#how-it-works" className={`${secondaryButtonClass} !text-slate-950`}>
                How it works
              </Link>
            </>
          )}
        />

        <SiteSection title="More than just a website. A complete toolkit for your business.">
          <p className="text-slate-600">
            Get a professional, fully managed online presence designed around how your business actually works. We handle setup, hosting and ongoing maintenance so you can focus on customers, bookings and day-to-day service.
          </p>
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-900 p-5 text-white">
            <p className="text-lg font-semibold">{leadTrustPoint.title}</p>
            <p className="mt-1 text-sm text-slate-200">{leadTrustPoint.detail}</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
              "Place order (with domain details)",
              "Your site is built",
              "Customise the look and feel of your business and add services, pricing, staff etc",
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
          subtitle="Choose your industry, explore the demo views, and start setup when you are ready."
          primaryHref="#industries"
          primaryLabel="Choose your business type"
          secondaryHref="/demo/taxi"
          secondaryLabel="View example demo"
        />
      </div>
    </main>
  );
}

