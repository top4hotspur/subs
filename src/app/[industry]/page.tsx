import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationsBlueprintSummary } from "@/components/industry/operations-blueprint-summary";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
import { getBlueprintForTemplate } from "@/lib/industry/operations-repository";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type IndustryPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

function getStakeholderHighlights(industry: string) {
  if (["barbers", "hairdressers", "beauticians", "nail-salon", "massage"].includes(industry)) {
    return {
      customer: [
        "View services, prices and durations",
        "Choose a preferred staff member where enabled",
        "Book appointments and receive confirmations",
        "Manage upcoming bookings through My Account",
      ],
      owner: [
        "Manage services, pricing and appointment timings",
        "Control staff, roles, rotas, breaks and closures",
        "Configure vouchers, policies and page content",
        "Run daily operations without needing a developer",
      ],
      staff: [
        "View today's and upcoming appointments",
        "Create manual or telephone bookings",
        "Check booking and payment status quickly",
        "Redeem/check gift vouchers where enabled",
      ],
    };
  }

  if (["gardeners", "cleaners", "window-cleaning", "mobile-valeting", "dog-grooming"].includes(industry)) {
    return {
      customer: [
        "View services and request clear quotes",
        "Book recurring-friendly services where enabled",
        "Receive confirmations and visit updates",
        "Track upcoming service visits in My Account",
      ],
      owner: [
        "Manage quote/request and recurring service options",
        "Control staffing, availability, closures and policies",
        "Configure service rules, pricing and local coverage pages",
        "Review incoming orders and customer requests in one place",
      ],
      staff: [
        "View daily and upcoming job schedules",
        "Create manual/phone bookings and updates",
        "Track job status and payment requirements",
        "Support field operations from the staff view",
      ],
    };
  }

  if (["driving-instructors", "tutors"].includes(industry)) {
    return {
      customer: [
        "Browse lesson options and pricing",
        "Book lessons or submit enquiries quickly",
        "Use block-booking options where enabled",
        "Manage upcoming and past bookings in My Account",
      ],
      owner: [
        "Manage lesson services, durations and pricing",
        "Control staff availability, rotas and closures",
        "Configure booking rules, policies and page content",
        "Review bookings and operational updates centrally",
      ],
      staff: [
        "See today's and upcoming lessons",
        "Add manual/telephone bookings fast",
        "Check customer, booking and payment status",
        "Keep daily schedules organised in one view",
      ],
    };
  }

  if (["bus-hire", "taxi"].includes(industry)) {
    return {
      customer: [
        "Submit transport and journey requests clearly",
        "Request group/event transport packages",
        "Receive confirmations and updates",
        "Manage upcoming requests in My Account where enabled",
      ],
      owner: [
        "Manage routes/services, pricing and request handling",
        "Control staff allocation, availability and closures",
        "Configure booking rules, policies and contact pages",
        "Track requests and operational workflow from one dashboard",
      ],
      staff: [
        "View today's and future transport jobs",
        "Create manual/phone bookings where needed",
        "Check request/payment status at a glance",
        "Support dispatch and customer operations efficiently",
      ],
    };
  }

  return {
    customer: [
      "View services and prices",
      "Book appointments or submit enquiries",
      "Receive confirmations and updates",
      "Manage upcoming bookings through My Account where available",
    ],
    owner: [
      "Manage services, prices and durations",
      "Control staff, roles, rotas, breaks and closures",
      "Configure booking rules, vouchers, policies and content",
      "Review bookings and customer requests in one place",
    ],
    staff: [
      "View today's and upcoming appointments",
      "Create manual or telephone bookings",
      "Check booking/payment status quickly",
      "Support daily operations from the staff view",
    ],
  };
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
  const highlights = getStakeholderHighlights(template.slug);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <SiteHero
        eyebrow={template.category}
        title={template.defaultConfig.heroHeadline}
        subtitle={template.defaultConfig.heroSubheading}
        helperText="The demo is a preview playground. Your live subscriber site is created clean and ready for your real business details."
        actions={(
          <>
            <Link href={`/demo/${template.slug}`} target="_blank" rel="noreferrer" className={primaryButtonClass}>
              View demo site
            </Link>
            <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
              Get your site now
            </Link>
          </>
        )}
      />

      <SiteSection title="Built around how your business works">
        <p className="text-slate-600">
          Your website supports the full journey for customers, business owners and staff — not just a basic online brochure.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <SiteCard title="Customer journey">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.customer.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </SiteCard>
          <SiteCard title="Business owner / manager journey">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.owner.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </SiteCard>
          <SiteCard title="Staff journey">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.staff.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
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
              <li>We confirm your business and domain details</li>
              <li>We provision your new subscriber site with clean defaults</li>
              <li>You add real services, staff, pricing and content in your site admin</li>
              <li>We host and manage it ongoing</li>
            </ol>
          </SiteCard>
        </div>
      </SiteSection>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-7 sm:px-8">
        <h2 className="text-2xl font-semibold text-white">Ready to launch your site?</h2>
        <p className="mt-2 text-slate-300">
          Open your industry demo, then place your order when you are ready.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
            Get your site now
          </Link>
          <Link href={`/demo/${template.slug}`} className={primaryButtonClass}>
            View demo site
          </Link>
        </div>
      </section>
    </main>
  );
}
