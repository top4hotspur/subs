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
import { getSocialPlatform } from "@/lib/sites/social-platforms";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";
import { getLocalVoucherSettings } from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";
import { mapAppearanceToTheme, normalizeSiteAppearance } from "@/lib/sites/site-appearance";

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

  const appearanceMode = normalizeSiteAppearance(
    settings.branding.visualTemplateId,
    settings.branding.colourSchemeId,
  );
  const appearanceTheme = mapAppearanceToTheme(appearanceMode);
  const scheme = getSiteColourSchemeById(appearanceTheme.colourPaletteId);
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

  const isDarkTheme = appearanceMode === "DARK";

  const wrapperClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const accentButtonClass = `inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${scheme.accentButtonClass}`;
  const navShellClass = isDarkTheme
    ? "rounded-xl border border-slate-700 bg-slate-900/70 p-2"
    : "rounded-2xl border border-slate-200 bg-white/80 p-2 backdrop-blur";
  const heroClass = `${scheme.heroBackgroundClass} rounded-3xl border ${scheme.borderClass} p-8 sm:p-10`;
  const serviceContainerClass = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
  const serviceCardClass = `${scheme.cardClass} p-6`;
  const serviceSummaryClass = scheme.mutedTextClass;

  return (
    <div className={`${wrapperClass} overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section className={heroClass}>
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

          <SiteBrandMark
            name={brandName}
            tagline={template.category}
            logoUrl={settings.branding.logoUrl}
            logoAlt={settings.branding.logoAlt}
            dark={isDarkTheme}
          />
          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight">{heroHeadline}</h1>
          {heroSubheading ? (
            <p className={`mt-3 max-w-2xl ${scheme.mutedTextClass}`}>{heroSubheading}</p>
          ) : null}
        </section>

        <SiteCard title="Services" subtitle="Built for a clean, professional customer booking experience.">
          <div className={serviceContainerClass}>
            {activeServices.map((service) => (
              <Link
                key={service.id}
                href={`/demo/${template.slug}/booking?service=${encodeURIComponent(service.id)}`}
                className={serviceCardClass}
              >
                <div>
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
                    {service.description || "Professional service tailored to local customers."}
                  </p>
                </div>
                <div className="mt-3">
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
                href={`/demo/${template.slug}/vouchers`}
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-transparent hover:bg-slate-100/60"
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
