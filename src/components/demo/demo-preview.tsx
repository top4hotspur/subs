"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteBrandMark } from "@/components/site-ui/site-brand-mark";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { DemoCustomisationDraft, DemoSiteService, WebsiteTemplate } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
};

function resolveActiveServices(template: WebsiteTemplate, draftServices: DemoSiteService[]): DemoSiteService[] {
  if (typeof window === "undefined") {
    return draftServices;
  }

  const settings = getLocalCustomerSiteSettings(template.slug, template);
  const active = settings.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceLabel: service.priceLabel,
    }));

  return active.length > 0 ? active : draftServices;
}

export function DemoPreview({ template, draft }: DemoPreviewProps) {
  const { config } = draft;
  const appointmentStyle = isAppointmentStyleIndustry(template.slug);
  const [requestServices] = useState<DemoSiteService[]>(() => resolveActiveServices(template, config.services));
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <section className="rounded-b-3xl border-b border-slate-800 bg-slate-900 px-6 py-8 text-white sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
        <SiteBrandMark name={config.businessName} tagline={template.category} dark />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{config.heroHeadline}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{config.heroSubheading}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/demo/${template.slug}/booking`} className={primaryButtonClass}>
            {config.ctaLabel}
          </Link>
        </div>
      </section>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <SiteCard title="Services" subtitle="Tile-based service layout matching your selected industry template.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {requestServices.map((service) => (
              <Link
                key={service.id}
                href={`/demo/${template.slug}/booking?service=${encodeURIComponent(service.id)}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
              >
                <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {service.description || "Professional service tailored to local customers."}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {getPublicServicePriceLabel(service) || "From £25"}
                </p>
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
          <SiteCard title="Demo login placeholder" subtitle={`${template.demoLogin.email} / ${template.demoLogin.password}`} />
        </div>

        <SiteCard
          title="Customer and team portal layers (planned)"
          subtitle="Live customer sites will have separate portal access for different users."
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Customer login: bookings, payments, vouchers, profile</li>
            <li>Staff login: appointments, telephone/manual bookings, voucher check and redeem</li>
            <li>Business admin login: services, staff, rota, pages, vouchers and financial reporting</li>
          </ul>
        </SiteCard>

        <SiteCard title="Future workflow support" subtitle="Bookings, quote requests, staff scheduling, completion updates, and review requests can be configured during setup.">
          <p className="text-sm text-slate-600">Appointments and customer updates are handled directly from the site portal experience.</p>
        </SiteCard>

        {appointmentStyle ? (
          <SiteCard
            title="Gift vouchers (planned module)"
            subtitle="Business admin will be able to enable/disable vouchers and choose delivery methods."
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Choose voucher value and issue a unique voucher ID</li>
              <li>Delivery methods: digital email, collect in store, post (with postage charge)</li>
              <li>Staff can check, redeem, and log voucher usage details</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">Payment and delivery setup will be finalised during onboarding.</p>
          </SiteCard>
        ) : null}

        <SiteFooterBlock
          brand={config.businessName}
          description="Managed local-business website subscription with ongoing support and clear setup workflow."
          groups={[
            {
              title: "Explore",
              links: [
                { label: "Bookings", href: `/demo/${template.slug}/booking` },
                { label: "About us", href: `/demo/${template.slug}/about` },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "Customer account", href: `/demo/${template.slug}/account` },
                { label: "Contact", href: `/demo/${template.slug}/contact` },
              ],
            },
            {
              title: "Team",
              links: [
                { label: "Staff view", href: `/demo/${template.slug}/staff` },
                { label: "Business admin", href: `/demo/${template.slug}/admin` },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}

