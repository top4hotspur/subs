import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { getCustomerSitePreviewData } from "@/lib/sites/customer-site-preview-repository";
import { getSiteColourSchemeById } from "@/lib/sites/site-colour-schemes";
import { getSiteVisualTemplateById } from "@/lib/sites/site-visual-templates";
import { outlineButtonClass, primaryButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

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

export default async function AdminSitePersistedPreviewPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const preview = await getCustomerSitePreviewData(siteId);
  if (!preview) {
    notFound();
  }

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
  const activeClosures = preview.scheduling.businessClosures.filter((closure) => closure.active);
  const activeHolidays = preview.scheduling.staffHolidays.filter((holiday) => holiday.active);
  const workingRotaDays = preview.scheduling.rotaDays.filter((day) => day.working);

  const isDark = theme.id === "urban-hipster";
  const shellClass = `${scheme.pageBackgroundClass} ${scheme.textClass}`;
  const heroClass = isDark
    ? `${scheme.heroBackgroundClass} rounded-xl border ${scheme.borderClass} p-8`
    : `${scheme.heroBackgroundClass} rounded-2xl border ${scheme.borderClass} p-8`;
  const cardClass = `${scheme.cardClass} p-5`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriber site preview</h1>
          <p className="mt-2 text-sm text-slate-600">
            This preview uses persisted subscriber-site settings. It is not yet custom-domain public routing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}`}
            className={`${outlineButtonClass} ${smallButtonClass}`}
            target="_blank"
            rel="noreferrer"
          >
            Open public site URL
          </Link>
          <Link href={`/admin/sites/${encodeURIComponent(siteId)}/settings`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to persisted settings
          </Link>
          <Link href={`/admin/sites?siteId=${encodeURIComponent(siteId)}`} className={`${outlineButtonClass} ${smallButtonClass}`}>
            Back to subscriber site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminPillNav />

      <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p>
          `/demo/[industry]` remains the general local demo playground.
          {" "}
          `/admin/sites/[siteId]/preview` renders persisted TenantSite data.
        </p>
      </section>

      <section className={`mt-6 overflow-hidden rounded-3xl border ${scheme.borderClass} ${shellClass} shadow-sm`}>
        <div className="space-y-6 px-6 py-8 sm:px-8">
          <div className={heroClass}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${scheme.accentTextClass}`}>
              Persisted customer-facing site
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">{heroHeadline}</h2>
            {heroSubheading ? <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{heroSubheading}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/admin/sites/${encodeURIComponent(siteId)}/preview/booking`} className={`inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${scheme.accentButtonClass}`}>
                Book from persisted preview
              </Link>
              <Link href="#" className={`inline-flex rounded-lg border ${scheme.borderClass} bg-white px-4 py-2 text-sm font-semibold text-slate-900`}>
                Contact us
              </Link>
            </div>
            <p className={`mt-4 text-xs ${scheme.mutedTextClass}`}>
              Theme: {theme.name} | Palette: {scheme.name}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className={cardClass}>
              <h3 className="text-lg font-semibold">Services</h3>
              <p className={`mt-1 text-sm ${scheme.mutedTextClass}`}>Persisted service/pricing records for this subscriber site.</p>
              {activeServices.length === 0 ? (
                <p className={`mt-4 text-sm ${scheme.mutedTextClass}`}>No active persisted services yet.</p>
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
              <div className={cardClass}>
                <h3 className="text-base font-semibold">Contact and opening summary</h3>
                <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.phone || "Phone not set"}</p>
                <p className={`text-sm ${scheme.mutedTextClass}`}>{settings?.email || "Email not set"}</p>
                <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>{settings?.address || "Address not set"}</p>
                <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                  {settings?.openingHoursSummary || "Opening hours summary not set"}
                </p>
              </div>

              <div className={cardClass}>
                <h3 className="text-base font-semibold">Staff selection</h3>
                {selectableStaff.length === 0 ? (
                  <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>No customer-selectable staff configured.</p>
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

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Rota snapshot</h3>
              <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                {workingRotaDays.length} persisted working rota rows.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Business closures</h3>
              <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                {activeClosures.length} active closure date(s).
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Staff holidays</h3>
              <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                {activeHolidays.length} active holiday entry/entries.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Recent persisted bookings</h3>
              <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
                {preview.recentBookings.length} booking record(s) found.
              </p>
            </div>
          </div>

          {preview.recentBookings.length > 0 ? (
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Latest booking requests</h3>
              <div className="mt-3 space-y-2">
                {preview.recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className={`rounded-lg border ${scheme.borderClass} bg-white p-3 text-sm text-slate-800`}>
                    <p className="font-semibold">{booking.customerName}</p>
                    <p className="text-xs text-slate-600">
                      {booking.serviceName || "Service"} | {booking.preferredDate || "Date TBD"} {booking.preferredTime || ""}
                    </p>
                    <p className="text-xs text-slate-600">
                      Staff: {booking.staffName || "Unassigned"} | Status: {booking.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className={cardClass}>
            <h3 className="text-base font-semibold">Preview status note</h3>
            <p className={`mt-2 text-sm ${scheme.mutedTextClass}`}>
              This milestone proves persisted TenantSite rendering for customer-facing pages.
              Booking request persistence, public domain host routing, and subscriber-authenticated
              business-owner runtime are planned for later milestones.
            </p>
            <div className="mt-3">
              <Link
                href={`/admin/sites/${encodeURIComponent(siteId)}/settings`}
                className={`${primaryButtonClass} ${smallButtonClass}`}
              >
                Edit persisted site data
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
