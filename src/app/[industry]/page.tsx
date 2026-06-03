import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteHero } from "@/components/site-ui/site-hero";
import { SiteSection } from "@/components/site-ui/site-section";
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
        "View services, prices and appointment options online",
        "Book or send enquiries without needing to phone",
        "Choose a preferred staff member where you allow it",
        "Receive booking confirmations and updates",
        "Manage upcoming bookings through their account",
        "Come back and book again more easily",
      ],
      staff: [
        "See today's appointments and upcoming bookings",
        "Add telephone or walk-in bookings where allowed",
        "Check customer, service and payment details",
        "Update appointment progress",
        "Help manage repeat customers smoothly",
        "Check and redeem gift vouchers where enabled",
      ],
      owner: [
        "Control services, pricing and durations",
        "Manage staff, roles, rotas, breaks and closures",
        "View customer records and booking history",
        "Set policies, page content and business details",
        "Offer gift vouchers and customer updates",
        "Run more of your business without waiting on a developer",
      ],
    };
  }

  if (["gardeners", "cleaners", "window-cleaning", "mobile-valeting", "dog-grooming"].includes(industry)) {
    return {
      customer: [
        "View services, prices and appointment options online",
        "Book or send enquiries without needing to phone",
        "Choose preferred time slots that fit your schedule",
        "Receive booking confirmations and updates",
        "Manage upcoming bookings through their account",
        "Come back and book again more easily",
      ],
      staff: [
        "See today's appointments and upcoming bookings",
        "Add telephone or walk-in bookings where allowed",
        "Check customer, service and payment details",
        "Update appointment progress",
        "Help manage repeat customers smoothly",
        "Track recurring visits where enabled",
      ],
      owner: [
        "Control services, pricing and durations",
        "Manage staff, roles, rotas, breaks and closures",
        "View customer records and booking history",
        "Set policies, page content and business details",
        "Offer recurring service options where enabled",
        "Run more of your business without waiting on a developer",
      ],
    };
  }

  if (["driving-instructors", "tutors"].includes(industry)) {
    return {
      customer: [
        "View services, prices and lesson options online",
        "Book or send enquiries without needing to phone",
        "Choose a preferred instructor where you allow it",
        "Receive booking confirmations and updates",
        "Manage upcoming bookings through their account",
        "Come back and book again more easily",
      ],
      staff: [
        "See today's appointments and upcoming bookings",
        "Add telephone or walk-in bookings where allowed",
        "Check customer, service and payment details",
        "Update appointment progress",
        "Help manage repeat customers smoothly",
        "Support block bookings where enabled",
      ],
      owner: [
        "Control services, pricing and durations",
        "Manage staff, roles, rotas, breaks and closures",
        "View customer records and booking history",
        "Set policies, page content and business details",
        "Offer block booking options where enabled",
        "Run more of your business without waiting on a developer",
      ],
    };
  }

  if (["bus-hire", "taxi"].includes(industry)) {
    return {
      customer: [
        "View services, prices and booking options online",
        "Send journey or group enquiries without needing to phone",
        "Choose available booking options that suit their trip",
        "Receive booking confirmations and updates",
        "Manage upcoming bookings through their account",
        "Come back and book again more easily",
      ],
      staff: [
        "See today's appointments and upcoming bookings",
        "Add telephone or walk-in bookings where allowed",
        "Check customer, service and payment details",
        "Update appointment progress",
        "Help manage repeat customers smoothly",
        "Support dispatch and booking operations clearly",
      ],
      owner: [
        "Control services, pricing and durations",
        "Manage staff, roles, rotas, breaks and closures",
        "View customer records and booking history",
        "Set policies, page content and business details",
        "Handle quote, booking and journey requests from one place",
        "Run more of your business without waiting on a developer",
      ],
    };
  }

  return {
    customer: [
      "View services, prices and appointment options online",
      "Book or send enquiries without needing to phone",
      "Choose a preferred staff member where you allow it",
      "Receive booking confirmations and updates",
      "Manage upcoming bookings through their account",
      "Come back and book again more easily",
    ],
    staff: [
      "See today's appointments and upcoming bookings",
      "Add telephone or walk-in bookings where allowed",
      "Check customer, service and payment details",
      "Update appointment progress",
      "Help manage repeat customers smoothly",
      "Check and redeem gift vouchers where enabled",
    ],
    owner: [
      "Control services, pricing and durations",
      "Manage staff, roles, rotas, breaks and closures",
      "View customer records and booking history",
      "Set policies, page content and business details",
      "Offer gift vouchers and customer updates",
      "Run more of your business without waiting on a developer",
    ],
  };
}

const onboardingSteps = [
  {
    title: "Choose your domain option",
    copy: "Tell us whether you own a domain, want to point one to your new site, or would like us to register/manage one for you.",
  },
  {
    title: "We prepare your website",
    copy: "We create your clean subscriber site and admin area, ready for your real business details rather than copied demo content.",
  },
  {
    title: "You get your admin access",
    copy: "We send your login details so you can add services, prices, staff, opening hours, policies, vouchers and page content.",
  },
  {
    title: "You stay in control",
    copy: "Manage bookings, customers, staff, rotas, services, vouchers, payment setup and business content from one place.",
  },
];

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  if (!template) {
    notFound();
  }

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

      <SiteSection title="Built to help you run the whole business">
        <p className="text-slate-600">
          Your website should do more than show your opening hours. MyExperiment.club gives your customers an easier way to book, gives your staff the tools to keep appointments moving, and gives you control of the business from one simple admin area.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <SiteCard title="For your customers">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.customer.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </SiteCard>
          <SiteCard title="For your staff">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.staff.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </SiteCard>
          <SiteCard title="For you as the owner">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {highlights.owner.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </SiteCard>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">
          One website. One admin area. More control over the way your business works.
        </p>
      </SiteSection>

      <SiteSection title="What happens after you subscribe?" eyebrow="Simple onboarding flow">
        <p className="text-slate-600">
          We keep the setup simple. Once your order is placed, we prepare your clean website, help with your domain route, and give you access to your business admin area so you can start setting up your services, staff, prices and content.
        </p>
        <ol className="mt-6 grid gap-4 lg:grid-cols-4 lg:gap-0">
          {onboardingSteps.map((step, index) => (
            <li key={step.title} className="relative flex lg:block">
              {index > 0 ? (
                <span className="absolute left-5 top-0 h-full w-px bg-teal-200 lg:left-0 lg:top-7 lg:h-px lg:w-full lg:-translate-x-1/2" aria-hidden="true" />
              ) : null}
              <div className="relative z-10 flex gap-3 lg:flex-col lg:items-center lg:px-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-white text-sm font-bold text-teal-700 shadow-sm">
                  {index + 1}
                </span>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-44 lg:text-center">
                  <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{step.copy}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm font-medium text-slate-700">
          You are not left to figure it out alone. We are on hand to help with setup questions, domain steps and ongoing support.
        </p>
      </SiteSection>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-7 sm:px-8">
        <h2 className="text-2xl font-semibold text-white">Ready to get your business online properly?</h2>
        <p className="mt-2 text-slate-300">
          Start with the demo if you want to explore the experience, or place your order and we will begin preparing your clean website and admin area.
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
