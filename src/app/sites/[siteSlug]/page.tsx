import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import { mapAppearanceToTheme, normalizeSiteAppearance } from "@/lib/sites/site-appearance";
import {
  normalizePersistedSocialLinks,
  SOCIAL_PLATFORM_DEFINITIONS,
  type PersistedSocialLinks,
} from "@/lib/sites/social-platforms";
import { SiteCookieNotice } from "@/components/site-ui/site-cookie-notice";

function formatMoney(amount: number | null, currencyCode: string): string {
  if (amount === null) return "Quote required";
  const code = currencyCode === "EUR" || currencyCode === "USD" ? currencyCode : "GBP";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatServiceSummary(durationMinutes: number | null): string {
  const segments: string[] = [];
  if (durationMinutes !== null) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours > 0 && minutes > 0) segments.push(`${hours} hr ${minutes} mins`);
    else if (hours > 0) segments.push(hours === 1 ? "1 hr" : `${hours} hrs`);
    else segments.push(`${durationMinutes} mins`);
  }
  return segments.length > 0 ? segments.join(" - ") : "Duration available at booking";
}

function mapUrlFromAddress(address: string | null): string | null {
  if (!address || !address.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

function getEnabledSocialEntries(socialLinks: PersistedSocialLinks) {
  const entries = [
    { key: "facebook", id: "facebook" },
    { key: "instagram", id: "instagram" },
    { key: "tiktok", id: "tiktok" },
    { key: "xTwitter", id: "x-twitter" },
    { key: "linkedin", id: "linkedin" },
    { key: "youtube", id: "youtube" },
  ] as const;

  return entries
    .map((entry) => {
      const value = socialLinks[entry.key];
      if (!value?.enabled || !value.url) return null;
      const platform = SOCIAL_PLATFORM_DEFINITIONS.find((item) => item.id === entry.id);
      if (!platform) return null;
      return {
        platform,
        url: value.url,
      };
    })
    .filter((item): item is { platform: (typeof SOCIAL_PLATFORM_DEFINITIONS)[number]; url: string } => Boolean(item));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}): Promise<Metadata> {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) {
    return {
      title: "Subscriber site",
    };
  }
  const settings = preview.settings;
  const siteName = settings?.siteDisplayName || settings?.businessName || preview.tenantSite.displayName;
  return {
    title: siteName,
    icons: settings?.faviconUrl
      ? {
          icon: settings.faviconUrl,
          shortcut: settings.faviconUrl,
        }
      : undefined,
  };
}

export default async function PublicSiteSlugPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();

  const settings = preview.settings;
  const appearanceMode = normalizeSiteAppearance(
    settings?.visualThemeId ?? undefined,
    settings?.colourPaletteId ?? undefined,
  );
  const appearanceTheme = mapAppearanceToTheme(appearanceMode);
  const scheme = getSiteColourSchemeById(appearanceTheme.colourPaletteId);
  const currencyCode = settings?.currency ?? "GBP";
  const siteName = settings?.siteDisplayName || settings?.businessName || preview.tenantSite.displayName;
  const heroHeadline = settings?.heroHeadline || `Welcome to ${siteName}`;
  const heroSubheading = settings?.heroSubheading || "";
  const activeServices = preview.services.filter((service) => service.active);
  const activeCategories = preview.serviceCategories.filter((category) => category.active);
  const activeCategoryIds = new Set(activeCategories.map((category) => category.id));
  const groupedServices = activeCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      services: activeServices.filter((service) => service.categoryId === category.id),
    }))
    .filter((group) => group.services.length > 0);
  const uncategorisedServices = activeServices.filter(
    (service) => !service.categoryId || !activeCategoryIds.has(service.categoryId),
  );
  const serviceGroups = [
    ...groupedServices,
    ...(uncategorisedServices.length > 0
      ? [{
          id: "uncategorised",
          name: groupedServices.length > 0 ? "Other services" : "Services",
          services: uncategorisedServices,
        }]
      : []),
  ];
  const publicStaff = preview.staffMembers.filter((member) => member.active);
  const socialLinks = normalizePersistedSocialLinks(settings?.socialLinks);
  const socialEntries = getEnabledSocialEntries(socialLinks);
  const mapsUrl = settings?.contactMapEnabled ? mapUrlFromAddress(settings?.address ?? null) : null;

  const isDark = appearanceMode === "DARK";
  const shellClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const heroClass = isDark
    ? `${scheme.heroBackgroundClass} rounded-xl border ${scheme.borderClass} p-8`
    : `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8`;
  const cardClass = `${scheme.cardClass} p-5`;
  const bookingHref = "#services";
  const aboutHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/about`;
  const contactHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/contact`;
  const policyHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/policy`;
  const cookiesHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/cookies`;
  const privacyHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/privacy`;
  const siteAdminHref = `/site-admin/${encodeURIComponent(preview.tenantSite.slug)}`;

  return (
    <main className={`min-h-screen ${shellClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
          <header className={`border-b ${scheme.borderClass} px-6 py-4 sm:px-8`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide">{siteName}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <a href="#home" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Home</a>
                <a href="#services" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Services</a>
                <a href={bookingHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Book now</a>
                {settings?.aboutPageEnabled ? (
                  <Link href={aboutHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">About</Link>
                ) : (
                  <a href="#about" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">About</a>
                )}
                <Link href={contactHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Contact</Link>
                <a href="#customer-login" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Customer login</a>
              </div>
            </div>
          </header>
          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div id="home" className={heroClass}>
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={`${siteName} logo`}
                  className="h-14 w-auto max-w-[220px] rounded-md border border-white/20 bg-white/10 p-1"
                />
              ) : null}
              <p className={`text-xs font-semibold uppercase tracking-wider ${scheme.accentTextClass}`}>
                {siteName}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">{heroHeadline}</h1>
              {heroSubheading ? <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{heroSubheading}</p> : null}
            </div>

            <div className="space-y-6">
              <div id="services" className={cardClass}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Services</h2>
                    <p className={`mt-1 text-sm ${scheme.mutedTextClass}`}>
                      Choose a service to start. Online booking will be connected in a later milestone.
                    </p>
                  </div>
                  {publicStaff.length > 0 ? (
                    <p className="text-xs font-semibold text-slate-600">
                      Staff choice can be offered during booking once enabled.
                    </p>
                  ) : null}
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
                        {(serviceGroups.length > 1 || group.id !== "uncategorised") ? (
                          <h3 className="text-base font-semibold text-slate-900">{group.name}</h3>
                        ) : null}
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {group.services.map((service) => (
                            <article key={service.id} className={`rounded-xl border ${scheme.borderClass} bg-white p-4`}>
                              <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                              <p className="mt-1 text-xs text-slate-600">
                                {service.description || "Professional service details will appear here."}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatMoney(service.basePrice, currencyCode)}
                                </p>
                                <span className="text-xs text-slate-400">|</span>
                                <p className="text-xs text-slate-600">
                                  {formatServiceSummary(service.durationMinutes)}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled
                                className="mt-3 inline-flex cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                              >
                                Book this service (coming soon)
                              </button>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              {settings?.aboutBody?.trim() ? (
                <div id="about" className={cardClass}>
                  <h3 className="text-base font-semibold">About us</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings.aboutBody}</p>
                </div>
              ) : null}
            </div>

            <footer className={`rounded-xl border ${scheme.borderClass} bg-white p-4 text-xs text-slate-600`}>
              <div id="contact" className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
                {settings?.phone ? <span>Phone: {settings.phone}</span> : null}
                {settings?.email ? <span>Email: {settings.email}</span> : null}
                {settings?.openingHoursSummary ? <span>Opening: {settings.openingHoursSummary}</span> : null}
                {mapsUrl ? (
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="hover:text-slate-900">
                    Map
                  </a>
                ) : null}
              </div>
              {socialEntries.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {socialEntries.map(({ platform, url }) => (
                    <a
                      key={platform.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={platform.accessibleLabel}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-transparent hover:bg-slate-100/60"
                    >
                      <img src={platform.iconPath} alt="" className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <span id="customer-login" className="text-slate-600">Customer login (coming soon)</span>
                <Link href={privacyHref} className="hover:text-slate-900">Privacy Policy</Link>
                <Link href={cookiesHref} className="hover:text-slate-900">Cookie Policy</Link>
                <Link href={policyHref} className="hover:text-slate-900">Terms / Policies</Link>
                <span className="mx-1 text-slate-300">|</span>
                <span id="staff-access" className="hover:text-slate-900">Staff login (coming soon)</span>
                <Link href={siteAdminHref} className="hover:text-slate-900">Business admin login</Link>
              </div>
            </footer>
          </div>
        </section>
      </div>
      <SiteCookieNotice siteSlug={preview.tenantSite.slug} />
    </main>
  );
}
