"use client";

import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";

type Props = {
  template: WebsiteTemplate;
  mode: "about" | "contact";
};

export function DemoAboutContactPage({ template, mode }: Props) {
  const settings = getLocalCustomerSiteSettings(template.slug, template);
  const isAbout = mode === "about";
  const pageVisibility = settings.pageVisibility;
  const aboutContent = settings.pageContent.about;
  const contactContent = settings.pageContent.contact;

  const aboutEnabled = pageVisibility.about.enabled;
  const contactEnabled = true;
  const pageEnabled = isAbout ? aboutEnabled : contactEnabled;
  const mapsQuery = settings.businessDetails.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        settings.businessDetails.address,
      )}`
    : "";

  return (
    <DemoSitePageShell template={template} settings={settings}>
      {!pageEnabled ? (
        <SiteCard title="Page currently hidden" subtitle="This page is disabled in business admin settings.">
          <p className="text-sm text-slate-700">
            Enable this page in the Business Admin login area to show it on the public demo site.
          </p>
        </SiteCard>
      ) : isAbout ? (
        <SiteCard title={aboutContent.title || settings.businessDetails.businessName} subtitle="About your business">
          {aboutContent.mode === "STAFF_PROFILES" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">{aboutContent.body}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {aboutContent.staffProfiles.slice(0, 4).map((profile) => (
                  <article
                    key={profile.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-3 flex h-28 items-center justify-center rounded border border-dashed border-slate-300 bg-white text-xs text-slate-500">
                      {profile.imageUrl || "Profile image placeholder"}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                    <p className="text-xs font-medium text-slate-600">{profile.role}</p>
                    <p className="mt-2 text-sm text-slate-700">{profile.bio}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(aboutContent.imageUrl || aboutContent.imageUrlSecondary) &&
              aboutContent.imagePlacement !== "NONE" &&
              aboutContent.imagePlacement !== "BELOW_TEXT" ? (
                <div
                  className={`grid gap-3 ${
                    aboutContent.imagePlacement === "BESIDE_TEXT"
                      ? "md:grid-cols-2"
                      : "md:grid-cols-2"
                  }`}
                >
                  <div className="flex h-36 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    {aboutContent.imageUrl || "Image 1 placeholder"}
                  </div>
                  <div className="flex h-36 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    {aboutContent.imageUrlSecondary || "Image 2 placeholder"}
                  </div>
                </div>
              ) : null}
              <p className="text-sm text-slate-700">{aboutContent.body}</p>
              {(aboutContent.imageUrl || aboutContent.imageUrlSecondary) &&
              aboutContent.imagePlacement === "BELOW_TEXT" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex h-36 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    {aboutContent.imageUrl || "Image 1 placeholder"}
                  </div>
                  <div className="flex h-36 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    {aboutContent.imageUrlSecondary || "Image 2 placeholder"}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {aboutContent.ctaLabel && aboutContent.ctaHref ? (
            <a
              href={aboutContent.ctaHref}
              className="mt-4 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {aboutContent.ctaLabel}
            </a>
          ) : null}
        </SiteCard>
      ) : (
        <SiteCard title={contactContent.title || "Get in touch"} subtitle={contactContent.body || "Call, email, or send a booking request online."}>
          <div className="space-y-2 text-sm text-slate-700">
            <p>{contactContent.contactDetailsText}</p>
            <p>Phone: {settings.businessDetails.phone}</p>
            <p>Email: {settings.businessDetails.email}</p>
            {settings.businessDetails.address ? <p>Address: {settings.businessDetails.address}</p> : null}
            <p>Opening hours: {settings.businessDetails.openingHours}</p>
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">{contactContent.mapPlaceholderText}</p>
            {contactContent.showGoogleMapsLinkFromAddress && mapsQuery ? (
              <a
                href={mapsQuery}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                View on Google Maps
              </a>
            ) : null}
            {contactContent.ctaLabel && contactContent.ctaHref ? (
              <a
                href={contactContent.ctaHref}
                className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {contactContent.ctaLabel}
              </a>
            ) : null}
          </div>
        </SiteCard>
      )}
    </DemoSitePageShell>
  );
}
