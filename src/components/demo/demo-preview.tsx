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
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { getSiteVisualTemplateById } from "@/lib/sites/site-visual-templates";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";


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
  const visualTemplate = getSiteVisualTemplateById(settings.branding.visualTemplateId);
  const scheme = getSiteColourSchemeById(settings.branding.colourSchemeId);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const activeServices = settings.services.filter((service) => service.active);
  const socialEntries = Object.entries(settings.businessDetails.socialLinks ?? {}).filter(([, value]) => value && value.trim().length > 0);
  const brandName = settings.branding.siteName?.trim() || config.businessName;

  const heroClassByTemplate: Record<string, string> = {
    "modern-minimalist": `${scheme.lightBackgroundClass} text-slate-950`,
    "bold-edge": `${scheme.darkBackgroundClass} text-white`,
    "classic-immersive": `${scheme.darkSurfaceClass} text-white text-center`,
    "utility-list": "bg-slate-100 text-slate-950 rounded-none border-b border-slate-300",
    "split-screen-contemporary": "bg-white text-slate-950",
  };

  const outerClassByTemplate: Record<string, string> = {
    "modern-minimalist": "bg-slate-50",
    "bold-edge": "bg-slate-950 text-slate-100 border-slate-800",
    "classic-immersive": "bg-slate-50",
    "utility-list": "bg-slate-100",
    "split-screen-contemporary": "bg-slate-50",
  };

  const serviceContainerClassByTemplate: Record<string, string> = {
    "modern-minimalist": "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
    "bold-edge": "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
    "classic-immersive": "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
    "utility-list": "space-y-3",
    "split-screen-contemporary": "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
  };

  const serviceCardClassByTemplate: Record<string, string> = {
    "modern-minimalist": "rounded-2xl bg-white p-4 shadow border border-slate-100",
    "bold-edge": "rounded-2xl bg-slate-900 p-4 shadow border border-slate-700 text-white",
    "classic-immersive": "rounded-2xl bg-slate-50 p-4 shadow border border-slate-200",
    "utility-list": "flex items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3",
    "split-screen-contemporary": "rounded-2xl bg-white p-4 border-2 border-slate-200",
  };

  const accentButtonClass = `inline-flex rounded-lg px-4 py-2 text-sm font-semibold ${scheme.accentButtonClass}`;

  return (
    <div className={`overflow-hidden rounded-3xl border shadow-sm ${outerClassByTemplate[visualTemplate.id]}`}>
      <section className={`px-6 py-8 sm:px-8 ${heroClassByTemplate[visualTemplate.id]}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <DemoSiteNav
            templateSlug={template.slug}
            showAbout={settings.pageVisibility.about.enabled}
            showContact={settings.pageVisibility.contact.enabled}
          />
        </div>

        {visualTemplate.id === "split-screen-contemporary" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-center">
            <div>
              <SiteBrandMark
                name={brandName}
                tagline={template.category}
                logoUrl={settings.branding.logoUrl}
                logoAlt={settings.branding.logoAlt}
                dark={false}
              />
              <h1 className="mt-6 text-4xl font-bold tracking-tight">{config.heroHeadline}</h1>
              <p className="mt-3 max-w-2xl text-slate-700">{config.heroSubheading}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/demo/${template.slug}/booking`} className={accentButtonClass}>{config.ctaLabel}</Link>
              </div>
            </div>
            <div className={`min-h-52 rounded-2xl ${scheme.accentSoftClass} p-6 text-sm`}>
              <p className="font-semibold">Visual style preview</p>
              <p className="mt-2">This split-screen layout uses your selected colour scheme and can host hero imagery later.</p>
            </div>
          </div>
        ) : (
          <>
            <SiteBrandMark
              name={brandName}
              tagline={template.category}
              logoUrl={settings.branding.logoUrl}
              logoAlt={settings.branding.logoAlt}
              dark={visualTemplate.id === "bold-edge" || visualTemplate.id === "classic-immersive"}
            />
            <h1 className="mt-6 text-4xl font-bold tracking-tight">{config.heroHeadline}</h1>
            <p className={`mt-3 max-w-2xl ${visualTemplate.id === "bold-edge" || visualTemplate.id === "classic-immersive" ? "text-slate-200" : "text-slate-700"}`}>
              {config.heroSubheading}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/demo/${template.slug}/booking`} className={accentButtonClass}>{config.ctaLabel}</Link>
            </div>
          </>
        )}
      </section>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <SiteCard title="Services" subtitle="Tile-based service layout matching your selected industry template.">
          <div className={serviceContainerClassByTemplate[visualTemplate.id]}>
            {activeServices.map((service) => (
              <Link
                key={service.id}
                href={`/demo/${template.slug}/booking?service=${encodeURIComponent(service.id)}`}
                className={serviceCardClassByTemplate[visualTemplate.id]}
              >
                <div>
                  <p className={`text-sm font-semibold ${visualTemplate.id === "bold-edge" ? "text-white" : "text-slate-900"}`}>{service.name}</p>
                  <p className={`mt-1 text-xs ${visualTemplate.id === "bold-edge" ? "text-slate-300" : "text-slate-600"}`}>
                    {service.description || "Professional service tailored to local customers."}
                  </p>
                </div>
                <div className={visualTemplate.id === "utility-list" ? "text-right" : "mt-2"}>
                  <p className={`text-sm font-medium ${visualTemplate.id === "bold-edge" ? "text-white" : "text-slate-700"}`}>
                    {getPublicServicePriceLabel(service, currency) || "Quote required"}
                  </p>
                  <p className={`text-xs font-semibold ${scheme.accentTextClass}`}>Book this service</p>
                </div>
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

        {appointmentStyle ? (
          <SiteCard title="Gift vouchers" subtitle="Choose a value and delivery method that suits the customer.">
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Choose voucher value and issue a unique voucher ID</li>
              <li>Delivery methods: digital email, collect in store, post (with postage charge)</li>
              <li>Staff can check, redeem, and log voucher usage details</li>
            </ul>
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
