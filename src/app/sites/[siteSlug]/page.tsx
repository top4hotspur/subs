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
import { formatBusinessOpeningHoursSummary, normalizeBusinessOpeningHours } from "@/lib/sites/customer-site-opening-hours";
import { PublicSiteAvailabilityPreview } from "@/components/sites/public-site-availability-preview";
import { vouchersArePublic } from "@/lib/sites/customer-site-voucher-types";
import { buildPublicSitePath, getPublicSiteBasePath } from "@/lib/sites/public-site-url";
import { hasConnectedProviderCheckout, normalizePaymentProviderKey } from "@/lib/sites/payment-provider-connections";
import { isStripeConnectionCheckoutReady } from "@/lib/billing/stripe-tenant-checkout";

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

function formatUkDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatClosureRange(startDate: string, endDate: string | null): string {
  const end = endDate || startDate;
  return end === startDate ? formatUkDate(startDate) : `${formatUkDate(startDate)} to ${formatUkDate(end)}`;
}

function platformAbsolutePath(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://myexperiment.club";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
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
  const selectedPaymentProvider = normalizePaymentProviderKey(settings?.paymentProcessorName);
  const selectedPaymentConnection = preview.paymentProviderConnections.find((connection) => connection.provider === selectedPaymentProvider);
  const tenantCheckoutAvailable = hasConnectedProviderCheckout({
    connection: selectedPaymentConnection,
    checkoutImplemented: selectedPaymentProvider === "STRIPE" && isStripeConnectionCheckoutReady(selectedPaymentConnection),
  });
  const mapsUrl = settings?.contactMapEnabled ? mapUrlFromAddress(settings?.address ?? null) : null;
  const openingHoursSummary =
    formatBusinessOpeningHoursSummary(normalizeBusinessOpeningHours(settings?.openingHoursJson)) ||
    settings?.openingHoursSummary ||
    "";
  const today = new Date().toISOString().slice(0, 10);
  const upcomingClosure = preview.scheduling.businessClosures.find((closure) =>
    closure.active &&
    (closure.endDate || closure.date) >= today &&
    (closure.customerNote?.trim() || closure.label.trim()),
  );

  const isDark = appearanceMode === "DARK";
  const shellClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const heroClass = isDark
    ? `${scheme.heroBackgroundClass} rounded-xl border ${scheme.borderClass} p-8`
    : `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8`;
  const cardClass = `${scheme.cardClass} p-5`;
  const bookingHref = "#services";
  const publicBasePath = await getPublicSiteBasePath(preview.tenantSite.slug);
  const contactHref = buildPublicSitePath(publicBasePath, "contact");
  const policyHref = buildPublicSitePath(publicBasePath, "policy");
  const cookiesHref = buildPublicSitePath(publicBasePath, "cookies");
  const privacyHref = buildPublicSitePath(publicBasePath, "privacy");
  const siteAdminHref = platformAbsolutePath(`/site-admin/${encodeURIComponent(preview.tenantSite.slug)}`);
  const staffLoginHref = platformAbsolutePath(`/site-staff/${encodeURIComponent(preview.tenantSite.slug)}`);
  const customerAccountHref = buildPublicSitePath(publicBasePath, "account");
  const vouchersHref = buildPublicSitePath(publicBasePath, "vouchers");
  const giftVouchersVisible = vouchersArePublic(settings?.giftVoucherSettingsJson);

  return (
    <main className={`min-h-screen ${shellClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div id="home" className={heroClass}>
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide">{siteName}</p>
                <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label={`${siteName} navigation`}>
                  <a href="#home" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Home</a>
                  <a href="#services" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Services</a>
                  <a href={bookingHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Book now</a>
                  <Link href={contactHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Contact</Link>
                  <Link href={customerAccountHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Customer login</Link>
                </nav>
              </div>
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={`${siteName} logo`}
                  className="h-14 w-auto max-w-[220px] rounded-md border border-white/20 bg-white/10 p-1"
                />
              ) : null}
              <h1 className="mt-4 text-4xl font-bold tracking-tight">{heroHeadline}</h1>
              {heroSubheading ? <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{heroSubheading}</p> : null}
            </div>

            <div className="space-y-6">
              <div id="services" className={cardClass}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Services</h2>
                    <p className={`mt-1 text-sm ${scheme.mutedTextClass}`}>
                      {activeServices.length > 0 ? "Choose a service to start your booking." : "Services will appear here when setup is complete."}
                    </p>
                  </div>
                  {publicStaff.length > 0 ? (
                    <p className="text-xs font-semibold text-slate-600">
                      Staff availability will be used when online booking goes live.
                    </p>
                  ) : null}
                </div>
                {activeServices.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-teal-200 bg-teal-50 p-5">
                    <h3 className="text-base font-semibold text-slate-950">This site is almost ready</h3>
                    <p className="mt-2 text-sm text-slate-700">
                      Services, prices and durations will appear here once the business owner finishes setup.
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Are you the business owner? Sign in to your business admin area to add services, prices,
                      staff, opening hours and booking settings.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={siteAdminHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                      >
                        Open business admin
                      </Link>
                      <Link
                        href={contactHref}
                        className="rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-100"
                      >
                        Contact the business
                      </Link>
                    </div>
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
                              <PublicSiteAvailabilityPreview
                                siteSlug={preview.tenantSite.slug}
                                publicBasePath={publicBasePath}
                                serviceId={service.id}
                                serviceName={service.name}
                                acceptCashPayments={settings?.acceptCashPayments ?? false}
                                acceptCardPayments={settings?.acceptCardPayments ?? true}
                                requireBookingPrepayment={settings?.requireBookingPrepayment ?? false}
                                allowInStorePaymentRecording={settings?.allowInStorePaymentRecording ?? false}
                                paymentProviderConnected={selectedPaymentConnection?.connectionStatus === "CONNECTED" && selectedPaymentConnection.publicEnabled}
                                paymentProviderCheckoutEnabled={tenantCheckoutAvailable}
                                staff={publicStaff.map((member) => ({
                                  id: member.id,
                                  displayName: member.displayName,
                                  customerSelectable: member.customerSelectable,
                                }))}
                              />
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              {settings?.aboutPageEnabled && settings?.aboutBody?.trim() ? (
                <div id="about" className={cardClass}>
                  <h3 className="text-base font-semibold">About us</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings.aboutBody}</p>
                </div>
              ) : null}
            </div>

            <footer className={`rounded-xl border ${scheme.borderClass} bg-white p-4 text-xs text-slate-600`}>
              {upcomingClosure ? (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  <span className="font-semibold">Upcoming closure:</span>{" "}
                  {upcomingClosure.customerNote?.trim() || upcomingClosure.label} ({formatClosureRange(upcomingClosure.date, upcomingClosure.endDate)})
                </div>
              ) : null}
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">{siteName}</p>
                {preview.tenantSite.domainPrimary ? (
                  <p className="mt-1 text-xs text-slate-500">{preview.tenantSite.domainPrimary}</p>
                ) : null}
              </div>
              <div id="contact" className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
                {settings?.phone ? <span>Phone: {settings.phone}</span> : null}
                {settings?.email ? <span>Email: {settings.email}</span> : null}
                {openingHoursSummary ? <span>Opening: {openingHoursSummary}</span> : null}
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
                <Link href={customerAccountHref} className="hover:text-slate-900">Customer account</Link>
                {giftVouchersVisible ? <Link href={vouchersHref} className="hover:text-slate-900">Gift vouchers</Link> : null}
                <Link href={privacyHref} className="hover:text-slate-900">Privacy Policy</Link>
                <Link href={cookiesHref} className="hover:text-slate-900">Cookie Policy</Link>
                {settings?.policyPageEnabled ? (
                  <Link href={policyHref} className="hover:text-slate-900">Terms / Policies</Link>
                ) : null}
                <span className="mx-1 text-slate-300">|</span>
                <Link href={staffLoginHref} id="staff-access" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Staff login</Link>
                <Link href={siteAdminHref} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Business admin login</Link>
              </div>
            </footer>
          </div>
        </section>
      </div>
      <SiteCookieNotice siteSlug={preview.tenantSite.slug} publicBasePath={publicBasePath} />
    </main>
  );
}
