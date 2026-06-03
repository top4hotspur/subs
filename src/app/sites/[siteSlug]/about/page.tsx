import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerSitePreviewDataBySlug } from "@/lib/sites/customer-site-preview-repository";
import { getPublicSiteBasePath } from "@/lib/sites/public-site-url";

type StaffProfile = {
  name?: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
};

function parseStaffProfiles(input: unknown): StaffProfile[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        name: typeof row.name === "string" ? row.name : undefined,
        role: typeof row.role === "string" ? row.role : undefined,
        bio: typeof row.bio === "string" ? row.bio : undefined,
        imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : undefined,
      };
    });
}

export default async function PublicSiteAboutPage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const preview = await getCustomerSitePreviewDataBySlug(siteSlug);
  if (!preview) notFound();
  const publicBasePath = await getPublicSiteBasePath(preview.tenantSite.slug);

  const settings = preview.settings;
  if (!settings?.aboutPageEnabled) notFound();

  const siteName = settings.siteDisplayName || settings.businessName || preview.tenantSite.displayName;
  const title = settings.aboutTitle || `About ${siteName}`;
  const profiles = parseStaffProfiles(settings.aboutStaffProfilesJson);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <Link href={publicBasePath || "/"} className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Back to home
            </Link>
          </div>

          {settings.aboutPageMode === "STAFF_PROFILES" ? (
            <div className="mt-6 space-y-3">
              {settings.aboutBody ? <p className="text-sm leading-6 text-slate-700">{settings.aboutBody}</p> : null}
              {profiles.length === 0 ? (
                <p className="text-sm text-slate-600">Staff profile content will appear here once added in site admin.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {profiles.map((profile, index) => (
                    <article key={`${profile.name ?? "profile"}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {profile.imageUrl ? <img src={profile.imageUrl} alt={profile.name ?? "Staff profile"} className="mb-3 h-28 w-full rounded-lg object-cover" /> : null}
                      <h2 className="text-sm font-semibold text-slate-900">{profile.name || "Team member"}</h2>
                      {profile.role ? <p className="text-xs font-medium text-slate-600">{profile.role}</p> : null}
                      {profile.bio ? <p className="mt-2 text-sm text-slate-700">{profile.bio}</p> : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {settings.aboutImagePlacement === "ABOVE" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {settings.aboutImageOneUrl ? <img src={settings.aboutImageOneUrl} alt="About placeholder one" className="h-48 w-full rounded-lg object-cover" /> : null}
                  {settings.aboutImageTwoUrl ? <img src={settings.aboutImageTwoUrl} alt="About placeholder two" className="h-48 w-full rounded-lg object-cover" /> : null}
                </div>
              ) : null}
              {settings.aboutBody ? (
                <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{settings.aboutBody}</p>
              ) : (
                <p className="text-sm text-slate-600">About content has not been added yet.</p>
              )}
              {settings.aboutImagePlacement === "BESIDE" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {settings.aboutImageOneUrl ? <img src={settings.aboutImageOneUrl} alt="About placeholder one" className="h-48 w-full rounded-lg object-cover" /> : null}
                  {settings.aboutImageTwoUrl ? <img src={settings.aboutImageTwoUrl} alt="About placeholder two" className="h-48 w-full rounded-lg object-cover" /> : null}
                </div>
              ) : null}
              {settings.aboutImagePlacement === "BELOW" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {settings.aboutImageOneUrl ? <img src={settings.aboutImageOneUrl} alt="About placeholder one" className="h-48 w-full rounded-lg object-cover" /> : null}
                  {settings.aboutImageTwoUrl ? <img src={settings.aboutImageTwoUrl} alt="About placeholder two" className="h-48 w-full rounded-lg object-cover" /> : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
