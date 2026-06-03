import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteContactForm } from "@/components/sites/public-site-contact-form";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { normalizePersistedSocialLinks, SOCIAL_PLATFORM_DEFINITIONS } from "@/lib/sites/social-platforms";
import { formatBusinessOpeningHoursSummary, normalizeBusinessOpeningHours } from "@/lib/sites/customer-site-opening-hours";

function mapUrlFromAddress(address: string | null): string | null {
  if (!address || !address.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

export default async function PublicSiteContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string }>;
  searchParams: Promise<{
    purpose?: string;
    name?: string;
    email?: string;
    phone?: string;
    bookingId?: string;
  }>;
}) {
  const { siteSlug } = await params;
  const query = await searchParams;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();

  const settings = preview.settings;
  const siteName = settings?.siteDisplayName || settings?.businessName || preview.tenantSite.displayName;
  const title = settings?.contactTitle || `Contact ${siteName}`;
  const mapsUrl = settings?.contactMapEnabled ? mapUrlFromAddress(settings?.address ?? null) : null;
  const openingHoursSummary =
    formatBusinessOpeningHoursSummary(normalizeBusinessOpeningHours(settings?.openingHoursJson)) ||
    settings?.openingHoursSummary ||
    "";

  const social = normalizePersistedSocialLinks(settings?.socialLinks);
  const socialEntries = [
    ["facebook", "facebook"],
    ["instagram", "instagram"],
    ["tiktok", "tiktok"],
    ["xTwitter", "x-twitter"],
    ["linkedin", "linkedin"],
    ["youtube", "youtube"],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <Link href={`/sites/${encodeURIComponent(preview.tenantSite.slug)}`} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Back to home
            </Link>
          </div>

          {settings?.contactIntro ? <p className="mt-3 text-sm text-slate-700">{settings.contactIntro}</p> : null}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Phone</p>
            <p className="text-sm text-slate-700">{settings?.phone || "Phone not set"}</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">Email</p>
            <p className="text-sm text-slate-700">{settings?.email || "Email not set"}</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">Address</p>
            <p className="text-sm text-slate-700">{settings?.address || "Address not set"}</p>
            <p className="mt-3 text-sm font-semibold text-slate-900">Opening hours</p>
            <p className="text-sm text-slate-700">{openingHoursSummary || "Opening hours not set"}</p>

            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                View on Google Maps
              </a>
            ) : null}

            {settings?.contactMapNote ? <p className="mt-2 text-xs text-slate-600">{settings.contactMapNote}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {socialEntries.map(([key, platformId]) => {
                const entry = social[key];
                if (!entry?.enabled || !entry.url) return null;
                const platform = SOCIAL_PLATFORM_DEFINITIONS.find((item) => item.id === platformId);
                if (!platform) return null;
                return (
                  <a
                    key={key}
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={platform.accessibleLabel}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-transparent hover:bg-slate-100/60"
                  >
                    <img src={platform.iconPath} alt="" className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="mt-5">
            <PublicSiteContactForm
              siteSlug={preview.tenantSite.slug}
              initialPurpose={query.purpose}
              initialName={query.name}
              initialEmail={query.email}
              initialPhone={query.phone}
              bookingId={query.bookingId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
