"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteBrandMark } from "@/components/site-ui/site-brand-mark";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import {
  getLocalCustomerSiteSettings,
  getLocalCustomerSiteSettingsStorageKey,
} from "@/lib/sites/local-site-settings";
import { getSiteVisualTemplateById } from "@/lib/sites/site-visual-templates";
import { getSocialPlatform } from "@/lib/sites/social-platforms";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";
import { getLocalVoucherSettings } from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
};

const DELIVERY_METHOD_LABELS: Record<string, string> = {
  [VoucherDeliveryMethod.DIGITAL_EMAIL]: "Email",
  [VoucherDeliveryMethod.COLLECT_IN_STORE]: "Collect in store",
  [VoucherDeliveryMethod.POST]: "Post",
};

export function DemoPreview({ template, draft }: DemoPreviewProps) {
  const { config } = draft;
  const appointmentStyle = isAppointmentStyleIndustry(template.slug);
  const [settings, setSettings] = useState(() =>
    getLocalCustomerSiteSettings(template.slug, template),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getLocalCustomerSiteSettingsStorageKey(template.slug);
    const syncSettings = () => {
      setSettings(getLocalCustomerSiteSettings(template.slug, template));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        syncSettings();
      }
    };

    const onLocalUpdate = () => {
      syncSettings();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onLocalUpdate);
    window.addEventListener("subs:site-settings-updated", onLocalUpdate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onLocalUpdate);
      window.removeEventListener("subs:site-settings-updated", onLocalUpdate);
    };
  }, [template]);

  const theme = getSiteVisualTemplateById(settings.branding.visualTemplateId);
  const scheme = getSiteColourSchemeById(settings.branding.colourSchemeId);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const activeServices = settings.services.filter((service) => service.active);
  const socialEntries = Object.entries(settings.businessDetails.socialLinks ?? {}).filter(
    ([, value]) => value && value.trim().length > 0,
  );
  const brandName = settings.branding.siteName?.trim() || config.businessName;
  const heroHeadline = settings.branding.heroHeadline?.trim() || config.heroHeadline;
  const heroSubheading = settings.branding.heroSubheading?.trim() || "";
  const voucherSettings = getLocalVoucherSettings(template.slug);
  const deliveryOptions = voucherSettings.deliveryMethods
    .map((method) => DELIVERY_METHOD_LABELS[method])
    .filter(Boolean);

  const isDarkTheme =
    theme.id === "urban-hipster" ||
    (theme.id === "luxury-elegant" &&
      ["navy-gold", "emerald-champagne", "aubergine-pearl"].includes(scheme.id));

  const wrapperClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const accentButtonClass = `inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${scheme.accentButtonClass}`;
  const navShellClass = theme.id === "urban-hipster" ? "rounded-md border border-slate-700 bg-black/50 p-2" : "rounded-2xl border bg-white/80 p-2 backdrop-blur";

  const themeHeroById: Record<string, string> = {
    "modern-minimalist": `${scheme.heroBackgroundClass} rounded-3xl border ${scheme.borderClass} p-8 sm:p-10`,
    "vintage-classic": `${scheme.heroBackgroundClass} rounded-xl border-2 ${scheme.borderClass} p-8 sm:p-10`,
    "urban-hipster": `${scheme.heroBackgroundClass} rounded-md border ${scheme.borderClass} p-8 sm:p-10`,
    "luxury-elegant": `${scheme.heroBackgroundClass} rounded-3xl border ${scheme.borderClass} p-8 sm:p-10 shadow-xl`,
    "rustic-warm": `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8 sm:p-10`,
  };

  const titleClassByTheme: Record<string, string> = {
    "modern-minimalist": "text-4xl sm:text-5xl font-semibold tracking-tight",
    "vintage-classic": "text-4xl sm:text-5xl font-serif font-bold tracking-tight",
    "urban-hipster": "text-4xl sm:text-5xl font-extrabold uppercase tracking-wide",
    "luxury-elegant": "text-4xl sm:text-5xl font-semibold tracking-tight",
    "rustic-warm": "text-4xl sm:text-5xl font-bold tracking-tight",
  };

  const serviceContainerClass =
    theme.id === "rustic-warm"
      ? "space-y-3"
      : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

  const defaultCardClass = `${scheme.cardClass} p-5`;
  const serviceCardClassByTheme: Record<string, string> = {
    "modern-minimalist": `${scheme.cardClass} p-6`,
    "vintage-classic": `${scheme.cardClass} p-5`,
    "urban-hipster": `rounded-md border ${scheme.borderClass} ${scheme.heroPanelClass} p-5 shadow-lg`,
    "luxury-elegant": `rounded-2xl border ${scheme.borderClass} ${scheme.heroPanelClass} p-6 shadow-lg`,
    "rustic-warm": `flex items-center justify-between rounded-xl border ${scheme.borderClass} ${scheme.cardClass.replace(" p-", "")} p-4`,
  };

  const serviceSummaryClass = theme.id === "urban-hipster" ? "text-slate-300" : scheme.mutedTextClass;

  return (
    <div className={`${wrapperClass} overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section className={themeHeroById[theme.id]}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={navShellClass}>
              <DemoSiteNav
                templateSlug={template.slug}
                showAbout={settings.pageVisibility.about.enabled}
                showContact
                showPolicy={settings.pageVisibility.policy?.enabled ?? true}
              />
            </div>
          </div>

          {theme.id === "luxury-elegant" ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-stretch">
              <div className="flex flex-col justify-center">
                <SiteBrandMark
                  name={brandName}
                  tagline={template.category}
                  logoUrl={settings.branding.logoUrl}
                  logoAlt={settings.branding.logoAlt}
                  dark={isDarkTheme}
                />
                <h1 className={`mt-6 ${titleClassByTheme[theme.id]}`}>{heroHeadline}</h1>
                {heroSubheading ? (
                  <p className={`mt-3 max-w-2xl ${scheme.mutedTextClass}`}>{heroSubheading}</p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/demo/${template.slug}/booking`} className={accentButtonClass}>
                    {config.ctaLabel}
                  </Link>
                </div>
              </div>
              <div className={`rounded-2xl border ${scheme.borderClass} ${scheme.heroPanelClass} p-6`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${scheme.accentTextClass}`}>
                  Premium layout
                </p>
                <p className={`mt-3 text-sm ${scheme.mutedTextClass}`}>
                  Refined spacing and polished panels designed for premium local brands.
                </p>
              </div>
            </div>
          ) : (
            <>
              <SiteBrandMark
                name={brandName}
                tagline={template.category}
                logoUrl={settings.branding.logoUrl}
                logoAlt={settings.branding.logoAlt}
                dark={isDarkTheme}
              />
              <h1 className={`mt-6 ${titleClassByTheme[theme.id]}`}>{heroHeadline}</h1>
              {heroSubheading ? (
                <p className={`mt-3 max-w-2xl ${scheme.mutedTextClass}`}>{heroSubheading}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/demo/${template.slug}/booking`} className={accentButtonClass}>
                  {config.ctaLabel}
                </Link>
              </div>
            </>
          )}
        </section>

        <SiteCard title="Services" subtitle="Built around your selected site theme and palette.">
          <div className={serviceContainerClass}>
            {activeServices.map((service) => (
              <Link
                key={service.id}
                href={`/demo/${template.slug}/booking?service=${encodeURIComponent(service.id)}`}
                className={serviceCardClassByTheme[theme.id] ?? defaultCardClass}
              >
                <div>
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className={`mt-1 text-xs ${serviceSummaryClass}`}>
                    {service.description || "Professional service tailored to local customers."}
                  </p>
                </div>
                <div className={theme.id === "rustic-warm" ? "text-right" : "mt-3"}>
                  <p className="text-sm font-medium">
                    {getPublicServicePriceLabel(service, currency) || "Quote required"}
                  </p>
                  <p className={`text-xs font-semibold ${scheme.accentTextClass}`}>Book this service</p>
                </div>
              </Link>
            ))}
          </div>
        </SiteCard>

        {appointmentStyle && voucherSettings.enabled ? (
          <SiteCard
            title="Gift vouchers"
            subtitle="Choose a voucher value and delivery option for someone special."
          >
            <p className={`text-sm ${scheme.mutedTextClass}`}>
              Available delivery options: {deliveryOptions.join(", ")}.
            </p>
            <div className="mt-3">
              <Link
                href={`/demo/${template.slug}/account`}
                className={accentButtonClass}
              >
                Buy gift voucher
              </Link>
            </div>
          </SiteCard>
        ) : null}

        <SiteCard title="Contact and opening hours" subtitle={`${config.contact.phone} | ${config.contact.email}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className={`text-sm ${scheme.mutedTextClass}`}>{config.contact.address}</p>
              <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{config.openingHours.summary}</p>
            </div>
            {socialEntries.length > 0 ? (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {socialEntries.map(([key, value]) => (
                  (() => {
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
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${scheme.borderClass} ${scheme.heroPanelClass}`}
                      >
                        {platform.iconPath ? (
                          <img
                            src={platform.iconPath}
                            alt=""
                            aria-hidden="true"
                            className="h-5 w-5"
                          />
                        ) : (
                          <span className="text-[11px] font-bold uppercase text-slate-800">
                            in
                          </span>
                        )}
                      </a>
                    );
                  })()
                ))}
              </div>
            ) : null}
          </div>
        </SiteCard>

        <SiteFooterBlock
          brand={brandName}
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
