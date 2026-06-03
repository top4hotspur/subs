"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoAvailabilityPreview } from "@/components/demo/demo-availability-preview";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import {
  getLocalCustomerSiteSettings,
  getLocalCustomerSiteSettingsStorageKey,
} from "@/lib/sites/local-site-settings";
import { getSocialPlatform } from "@/lib/sites/social-platforms";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";
import { getLocalVoucherSettings } from "@/lib/vouchers/local-vouchers";
import { mapAppearanceToTheme, normalizeSiteAppearance } from "@/lib/sites/site-appearance";
import { vouchersArePublic } from "@/lib/sites/customer-site-voucher-types";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
  initialServiceId?: string;
};

function serviceDurationLabel(durationMinutes?: number): string {
  if (!durationMinutes) return "Duration configured in admin";
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} mins`;
  if (hours > 0) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${durationMinutes} mins`;
}

function demoServiceCategory(service: { category?: string; description?: string }, fallbackCategory: string): string {
  const category = service.category?.trim();
  if (category) return category;
  const description = service.description?.trim();
  if (description && /category$/i.test(description)) return description.replace(/\s+category$/i, "");
  if (description && ["Recurring residential round", "One-off cleans", "Specialist extras", "Commercial enquiries"].includes(description)) {
    return description;
  }
  return fallbackCategory || "Services";
}

export function DemoPreview({ template, draft, initialServiceId }: DemoPreviewProps) {
  const { config } = draft;
  const appointmentStyle = isAppointmentStyleIndustry(template.slug);
  const [settings, setSettings] = useState(() =>
    getLocalCustomerSiteSettings(template.slug, template),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getLocalCustomerSiteSettingsStorageKey(template.slug);
    const syncSettings = () => {
      setSettings(getLocalCustomerSiteSettings(template.slug, template));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) syncSettings();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncSettings);
    window.addEventListener("subs:site-settings-updated", syncSettings);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncSettings);
      window.removeEventListener("subs:site-settings-updated", syncSettings);
    };
  }, [template]);

  const appearanceMode = normalizeSiteAppearance(
    settings.branding.visualTemplateId,
    settings.branding.colourSchemeId,
  );
  const appearanceTheme = mapAppearanceToTheme(appearanceMode);
  const scheme = getSiteColourSchemeById(appearanceTheme.colourPaletteId);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const activeServices = settings.services.filter((service) => service.active);
  const activeCategoryNames = Array.from(
    new Set(
      activeServices
        .map((service) => demoServiceCategory(service, "Services"))
        .filter((category): category is string => Boolean(category)),
    ),
  );
  const serviceGroups = activeCategoryNames.length > 0
    ? activeCategoryNames.map((category) => ({
        id: category,
        name: category,
        services: activeServices.filter((service) => demoServiceCategory(service, "Services") === category),
      }))
    : [{ id: "services", name: "Services", services: activeServices }];
  const socialEntries = Object.entries(settings.businessDetails.socialLinks ?? {}).filter(
    ([, value]) => value && value.trim().length > 0,
  );
  const brandName = settings.branding.siteName?.trim() || config.businessName;
  const heroHeadline = settings.branding.heroHeadline?.trim() || config.heroHeadline;
  const heroSubheading = settings.branding.heroSubheading?.trim() || config.heroSubheading || "";
  const voucherSettings = getLocalVoucherSettings(template.slug);
  const giftVouchersVisible = appointmentStyle && vouchersArePublic({
    ...voucherSettings,
    publicEnabled: voucherSettings.enabled,
  });

  const wrapperClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const navLinkClass = "rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900";
  const heroClass = `${scheme.heroBackgroundClass} rounded-3xl border ${scheme.borderClass} p-8 sm:p-10`;
  const cardClass = `${scheme.cardClass} p-5`;
  const serviceCardClass = `${scheme.cardClass} p-4`;
  const serviceSummaryClass = scheme.mutedTextClass;
  const contactPhone = settings.businessDetails.phone || config.contact.phone;
  const contactEmail = settings.businessDetails.email || config.contact.email;
  const contactAddress = settings.businessDetails.address || config.contact.address;
  const openingHours = settings.businessDetails.openingHours || config.openingHours.summary;

  return (
    <div className={`${wrapperClass} overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
      <div className="space-y-6 px-6 py-8 sm:px-8">
        <header className={`border-b ${scheme.borderClass} pb-4`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide">{brandName}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <a href="#home" className={navLinkClass}>Home</a>
              <a href="#services" className={navLinkClass}>Services</a>
              <a href="#services" className={navLinkClass}>Book now</a>
              {giftVouchersVisible ? (
                <Link href={`/demo/${template.slug}/vouchers`} className={navLinkClass}>Gift vouchers</Link>
              ) : null}
              {settings.pageVisibility.about.enabled ? (
                <Link href={`/demo/${template.slug}/about`} className={navLinkClass}>About</Link>
              ) : null}
              <Link href={`/demo/${template.slug}/contact`} className={navLinkClass}>Contact</Link>
              <Link href={`/demo/${template.slug}/account`} className={navLinkClass}>Customer login</Link>
            </div>
          </div>
        </header>

        <section id="home" className={heroClass}>
          {settings.branding.logoUrl ? (
            <img
              src={settings.branding.logoUrl}
              alt={settings.branding.logoAlt || `${brandName} logo`}
              className="h-14 w-auto max-w-[220px] rounded-md border border-white/20 bg-white/10 p-1"
            />
          ) : null}
          <p className={`text-xs font-semibold uppercase tracking-wider ${scheme.accentTextClass}`}>
            {brandName}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{heroHeadline}</h1>
          {heroSubheading ? <p className={`mt-3 max-w-2xl ${scheme.mutedTextClass}`}>{heroSubheading}</p> : null}
        </section>

        <div id="services" className={cardClass}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Services</h2>
              <p className={`mt-1 text-sm ${scheme.mutedTextClass}`}>
                Choose a service to start. This demo mirrors the live customer site, but submissions stay demo-safe.
              </p>
            </div>
            <p className="text-xs font-semibold text-slate-600">Demo availability is illustrative only.</p>
          </div>

          {activeServices.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className={`text-sm ${scheme.mutedTextClass}`}>
                Services, prices and durations will appear here once the business owner finishes setup.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {serviceGroups.map((group) => (
                <section key={group.id}>
                  {serviceGroups.length > 1 ? (
                    <h3 className="text-base font-semibold text-slate-900">{group.name}</h3>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.services.map((service) => (
                      <article key={service.id} className={serviceCardClass}>
                        <p className="text-sm font-semibold">{service.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {service.recurringEnabled ? (
                            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              Recurring available
                            </span>
                          ) : null}
                          {service.blockBookingEnabled ? (
                            <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                              Block bookings available
                            </span>
                          ) : null}
                        </div>
                        <p className={`mt-1 text-xs ${serviceSummaryClass}`}>
                          {service.description || "Professional service details will appear here."}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">
                            {getPublicServicePriceLabel(service, currency) || "Quote required"}
                          </p>
                          <span className="text-xs text-slate-400">|</span>
                          <p className="text-xs text-slate-600">{serviceDurationLabel(service.durationMinutes)}</p>
                        </div>
                        <DemoAvailabilityPreview
                          templateSlug={template.slug}
                          serviceName={service.name}
                          durationMinutes={service.durationMinutes}
                          initialOpen={initialServiceId === service.id}
                        />
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {settings.pageVisibility.about.enabled && settings.pageContent.about.body?.trim() ? (
          <div id="about" className={cardClass}>
            <h3 className="text-base font-semibold">About us</h3>
            <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings.pageContent.about.body}</p>
          </div>
        ) : null}

        <footer className={`rounded-xl border ${scheme.borderClass} bg-white p-4 text-xs text-slate-600`}>
          <div id="contact" className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
            <span>Phone: {contactPhone}</span>
            <span>Email: {contactEmail}</span>
            <span>Opening: {openingHours}</span>
          </div>
          {contactAddress ? <p className="mb-3">Address: {contactAddress}</p> : null}
          {socialEntries.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {socialEntries.map(([key, value]) => {
                const platform = getSocialPlatform(key);
                if (!platform) return null;
                return (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={platform.accessibleLabel}
                    title={platform.label}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-transparent hover:bg-slate-100/60"
                  >
                    {platform.iconPath ? <img src={platform.iconPath} alt="" className="h-4 w-4" /> : "in"}
                  </a>
                );
              })}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/demo/${template.slug}/account`} className="hover:text-slate-900">Customer account</Link>
            {giftVouchersVisible ? <Link href={`/demo/${template.slug}/vouchers`} className="hover:text-slate-900">Gift vouchers</Link> : null}
            <Link href={`/demo/${template.slug}/policy`} className="hover:text-slate-900">Terms / Policies</Link>
            <Link href={`/demo/${template.slug}/contact`} className="hover:text-slate-900">Contact</Link>
            <span className="mx-1 text-slate-300">|</span>
            <Link href={`/demo/${template.slug}/staff`} className="hover:text-slate-900">Staff login</Link>
            <Link href={`/demo/${template.slug}/admin`} className="hover:text-slate-900">Business admin login</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
