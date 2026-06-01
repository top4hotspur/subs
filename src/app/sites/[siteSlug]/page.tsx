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

function formatMoney(amount: number | null, currencyCode: string): string {
  if (amount === null) return "Quote required";
  const code = currencyCode === "EUR" || currencyCode === "USD" ? currencyCode : "GBP";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatServiceSummary(durationMinutes: number | null, bufferAfterMinutes: number | null): string {
  const segments: string[] = [];
  if (durationMinutes !== null) segments.push(`${durationMinutes} min`);
  if (bufferAfterMinutes !== null) segments.push(`${bufferAfterMinutes} min buffer`);
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
  const selectableStaff = preview.staffMembers.filter(
    (member) => member.active && member.customerSelectable,
  );
  const socialLinks = normalizePersistedSocialLinks(settings?.socialLinks);
  const socialEntries = getEnabledSocialEntries(socialLinks);
  const mapsUrl = settings?.contactMapEnabled ? mapUrlFromAddress(settings?.address ?? null) : null;

  const isDark = appearanceMode === "DARK";
  const shellClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const heroClass = isDark
    ? `${scheme.heroBackgroundClass} rounded-xl border ${scheme.borderClass} p-8`
    : `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8`;
  const cardClass = `${scheme.cardClass} p-5`;
  const bookingHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/booking`;
  const aboutHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/about`;
  const contactHref = `/sites/${encodeURIComponent(preview.tenantSite.slug)}/contact`;
  const siteAdminHref = `/site-admin/${encodeURIComponent(preview.tenantSite.slug)}`;
  const vouchersEnabled = false;

  return (
    <main className={`min-h-screen ${shellClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
          <header className={`border-b ${scheme.borderClass} px-6 py-4 sm:px-8`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide">{siteName}</p>
              <nav aria-label="Tenant site navigation" className="flex flex-wrap gap-2 text-sm">
                <a href="#home" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Home</a>
                <a href="#services" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Services</a>
                <Link href={bookingHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Book now</Link>
                {vouchersEnabled ? (
                  <a href="#vouchers" className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Gift vouchers</a>
                ) : (
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-500">Gift vouchers (coming soon)</span>
                )}
                {settings?.aboutPageEnabled ? (
                  <Link href={aboutHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">About us</Link>
                ) : (
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-500">About us</span>
                )}
                <Link href={contactHref} className="rounded-md border border-slate-300 bg-white px-3 py-1 font-medium text-slate-900">Contact</Link>
              </nav>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a href="#customer-access" className="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900">Customer login / register</a>
              <a href="#staff-access" className="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900">Staff login</a>
              <Link href={siteAdminHref} className="rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900">Business admin login</Link>
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
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={contactHref}
                  className={`inline-flex rounded-lg border ${scheme.borderClass} bg-white px-4 py-2 text-sm font-semibold text-slate-900`}
                >
                  Contact us
                </Link>
                {settings?.aboutPageEnabled ? (
                  <Link
                    href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}/about`}
                    className={`inline-flex rounded-lg border ${scheme.borderClass} bg-white px-4 py-2 text-sm font-semibold text-slate-900`}
                  >
                    About us
                  </Link>
                ) : null}
                {settings?.policyPageEnabled ? (
                  <Link
                    href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}/policy`}
                    className={`inline-flex rounded-lg border ${scheme.borderClass} bg-white px-4 py-2 text-sm font-semibold text-slate-900`}
                  >
                    Policy
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div id="services" className={cardClass}>
                <h2 className="text-lg font-semibold">Services</h2>
                {activeServices.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <p className={`text-sm ${scheme.mutedTextClass}`}>
                      This business has not published services yet. Services, pricing and durations will appear here once the business owner finishes setup.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {activeServices.map((service) => (
                      <article key={service.id} className={`rounded-xl border ${scheme.borderClass} bg-white p-4`}>
                        <p className="text-sm font-semibold text-slate-900">{service.name}</p>
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
                        <p className="mt-1 text-xs text-slate-600">
                          {service.description || "Professional service details will appear here."}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {formatMoney(service.basePrice, currencyCode)}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatServiceSummary(service.durationMinutes, service.bufferAfterMinutes)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div id="contact" className={cardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold">Contact and opening summary</h3>
                    {socialEntries.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {socialEntries.map(({ platform, url }) => (
                          <a
                            key={platform.id}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={platform.accessibleLabel}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-transparent hover:bg-slate-100/60"
                          >
                            <img src={platform.iconPath} alt="" className="h-5 w-5" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.phone || "Phone not set"}</p>
                  <p className={`text-sm ${scheme.mutedTextClass}`}>{settings?.email || "Email not set"}</p>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.address || "Address not set"}</p>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                    {settings?.openingHoursSummary || "Opening hours summary not set"}
                  </p>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      View on Google Maps
                    </a>
                  ) : null}
                  {(settings?.cancellationFullRefundNoticeDays !== null ||
                    settings?.cancellationNoRefundWithinDays !== null ||
                    settings?.cancellationPolicyNote) ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-900">Cancellation policy</p>
                      <p className="mt-1 text-xs text-slate-700">
                        Full refund when cancelled at least {settings?.cancellationFullRefundNoticeDays ?? 1} day(s) before appointment.
                      </p>
                      <p className="text-xs text-slate-700">
                        No refund within {settings?.cancellationNoRefundWithinDays ?? 1} day(s) of appointment.
                      </p>
                      {settings?.cancellationPolicyNote ? (
                        <p className="mt-1 text-xs text-slate-700">{settings.cancellationPolicyNote}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className={cardClass}>
                  <h3 className="text-base font-semibold">Staff options</h3>
                  {selectableStaff.length === 0 ? (
                    <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>No preferred staff options currently available.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {selectableStaff.map((staff) => (
                        <li key={staff.id} className={scheme.mutedTextClass}>
                          {staff.displayName}
                          {staff.roleLabel ? ` - ${staff.roleLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div id="customer-access" className={cardClass}>
                  <h3 className="text-base font-semibold">Customer account access</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                    Customer login and registration will be available here in a future release.
                  </p>
                </div>

                <div id="staff-access" className={cardClass}>
                  <h3 className="text-base font-semibold">Staff access</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                    Staff login will be available here in a future release.
                  </p>
                </div>

                <div id="vouchers" className={cardClass}>
                  <h3 className="text-base font-semibold">Gift vouchers</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                    Gift vouchers are not enabled for this site yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
