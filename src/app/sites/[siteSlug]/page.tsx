import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import { getSiteVisualTemplateById } from "@/lib/sites/site-visual-templates";
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
  const theme = getSiteVisualTemplateById(settings?.visualThemeId ?? undefined);
  const scheme = getSiteColourSchemeById(settings?.colourPaletteId ?? undefined);
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

  const isDark = theme.id === "urban-hipster";
  const shellClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const heroClass = isDark
    ? `${scheme.heroBackgroundClass} rounded-xl border ${scheme.borderClass} p-8`
    : `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8`;
  const cardClass = `${scheme.cardClass} p-5`;

  return (
    <main className={`min-h-screen ${shellClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`overflow-hidden rounded-3xl border ${scheme.borderClass} shadow-sm`}>
          <div className="space-y-6 px-6 py-8 sm:px-8">
            <div className={heroClass}>
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
                  href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}/contact`}
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
              <div className={cardClass}>
                <h2 className="text-lg font-semibold">Services</h2>
                {activeServices.length === 0 ? (
                  <p className={`mt-3 text-sm ${scheme.mutedTextClass}`}>No services available yet.</p>
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
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
