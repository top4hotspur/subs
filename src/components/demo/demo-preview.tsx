"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DemoAccessDetailsCard } from "@/components/demo/demo-access-details-card";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteBrandMark } from "@/components/site-ui/site-brand-mark";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

export function DemoPreview({ template, draft }: DemoPreviewProps) {
  const { config } = draft;
  const appointmentStyle = isAppointmentStyleIndustry(template.slug);
  const settings = useMemo(() => getLocalCustomerSiteSettings(template.slug, template), [template]);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const activeServices = settings.services.filter((service) => service.active);
  const socialEntries = Object.entries(settings.businessDetails.socialLinks ?? {}).filter(([key, value]) => key !== "website" && value && value.trim().length > 0);
  const brandName = settings.branding.siteName?.trim() || config.businessName;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <section className="rounded-b-3xl border-b border-slate-800 bg-slate-900 px-6 py-8 text-white sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
        <SiteBrandMark
          name={brandName}
          tagline={template.category}
          logoUrl={settings.branding.logoUrl}
          logoAlt={settings.branding.logoAlt}
          dark
        />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{config.heroHeadline}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{config.heroSubheading}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/demo/${template.slug}/booking`} className={primaryButtonClass}>{config.ctaLabel}</Link>
        </div>
      </section>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <SiteCard title="Services" subtitle="Tile-based service layout matching your selected industry template.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeServices.map((service) => (
              <Link key={service.id} href={`/demo/${template.slug}/booking?service=${encodeURIComponent(service.id)}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                <p className="mt-1 text-xs text-slate-600">{service.description || "Professional service tailored to local customers."}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{getPublicServicePriceLabel(service, currency) || "Quote required"}</p>
                <p className="mt-2 text-xs font-semibold text-sky-700">Book this service</p>
              </Link>
            ))}
          </div>
        </SiteCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SiteCard title="Contact" subtitle={`${config.contact.phone} | ${config.contact.email}`}>
            <p className="text-sm text-slate-600">{config.contact.address}</p>
          </SiteCard>
          <SiteCard title="Opening hours" subtitle={config.openingHours.summary} />
          <SiteCard title="Portal access" subtitle="Customer, staff, and business admin areas">
            <p className="text-sm text-slate-600">Customer, staff, and business admin logins are available as separate site-scoped demo areas.</p>
          </SiteCard>
        </div>

        <DemoAccessDetailsCard compact />

        {socialEntries.length > 0 ? (
          <SiteCard title="Follow us" subtitle="Social media links configured in business admin settings.">
            <div className="flex flex-wrap gap-2">
              {socialEntries.map(([key, value]) => (
                <a key={key} href={value} target="_blank" rel="noreferrer" aria-label={`Visit us on ${SOCIAL_LABELS[key] ?? key}`} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                  {SOCIAL_LABELS[key] ?? key}
                </a>
              ))}
            </div>
          </SiteCard>
        ) : null}

        <SiteCard title="Customer and team portal areas" subtitle="Separate access for customers, staff, and business owners.">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Customer login: bookings, payments, vouchers, profile</li>
            <li>Staff login: appointments, telephone/manual bookings, voucher check and redeem</li>
            <li>Business admin login: services, staff, rota, pages, vouchers and financial reporting</li>
          </ul>
        </SiteCard>

        <SiteCard title="Business workflow support" subtitle="Bookings, quote requests, staff scheduling, completion updates, and review requests can be configured during setup.">
          <p className="text-sm text-slate-600">Appointments and customer updates are handled directly from the site portal experience.</p>
        </SiteCard>

        {appointmentStyle ? (
          <SiteCard title="Gift vouchers" subtitle="Choose a value and delivery method that suits the customer.">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Choose voucher value and issue a unique voucher ID</li>
              <li>Delivery methods: digital email, collect in store, post (with postage charge)</li>
              <li>Staff can check, redeem, and log voucher usage details</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">Voucher options can be configured by the business owner in the site admin area.</p>
          </SiteCard>
        ) : null}

        <SiteFooterBlock
          brand={brandName}
          description="Managed local-business website subscription with ongoing support and clear setup workflow."
          groups={[
            { title: "Explore", links: [{ label: "Bookings", href: `/demo/${template.slug}/booking` }, { label: "About us", href: `/demo/${template.slug}/about` }] },
            { title: "Account", links: [{ label: "Customer account", href: `/demo/${template.slug}/account` }, { label: "Contact", href: `/demo/${template.slug}/contact` }] },
            { title: "Team", links: [{ label: "Staff view", href: `/demo/${template.slug}/staff` }, { label: "Business admin", href: `/demo/${template.slug}/admin` }] },
          ]}
        />
      </div>
    </div>
  );
}


