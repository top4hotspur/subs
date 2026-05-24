import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import { getSiteVisualTemplateById } from "@/lib/sites/site-visual-templates";

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
              <p className={`text-xs font-semibold uppercase tracking-wider ${scheme.accentTextClass}`}>
                {siteName}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">{heroHeadline}</h1>
              {heroSubheading ? <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{heroSubheading}</p> : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}/booking`}
                  className={`inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${scheme.accentButtonClass}`}
                >
                  Book appointment
                </Link>
                <a href="#contact" className={`inline-flex rounded-lg border ${scheme.borderClass} bg-white px-4 py-2 text-sm font-semibold text-slate-900`}>
                  Contact us
                </a>
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
                  <h3 className="text-base font-semibold">Contact and opening summary</h3>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.phone || "Phone not set"}</p>
                  <p className={`text-sm ${scheme.mutedTextClass}`}>{settings?.email || "Email not set"}</p>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.address || "Address not set"}</p>
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                    {settings?.openingHoursSummary || "Opening hours summary not set"}
                  </p>
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

