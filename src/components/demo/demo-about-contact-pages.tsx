"use client";

import { DemoSiteNav } from "@/components/demo/demo-site-nav";
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
  const contactEnabled = pageVisibility.contact.enabled;
  const pageEnabled = isAbout ? aboutEnabled : contactEnabled;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{template.category}</p>
        <h1 className="mt-2 text-3xl font-bold">{isAbout ? "About us" : "Contact"}</h1>
        <div className="mt-4">
          <DemoSiteNav
            templateSlug={template.slug}
            showAbout={aboutEnabled}
            showContact={contactEnabled}
          />
        </div>
      </section>

      {!pageEnabled ? (
        <SiteCard title="Page currently hidden" subtitle="This page is disabled in business admin settings.">
          <p className="text-sm text-slate-700">
            Enable this page in the Business Admin login area to show it on the public demo site.
          </p>
        </SiteCard>
      ) : isAbout ? (
        <SiteCard title={aboutContent.title || settings.businessDetails.businessName} subtitle="About your business">
          {aboutContent.imagePlacement !== "NONE" ? (
            <p className="mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
              {aboutContent.imagePlacement === "ABOVE_TEXT"
                ? "Image placement: above text"
                : "Image placement: beside text"}
              {aboutContent.imageUrl ? ` (${aboutContent.imageUrl})` : " (image placeholder)"}
            </p>
          ) : null}
          <p className="text-sm text-slate-700">{aboutContent.body}</p>
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
            {settings.businessDetails.serviceAreas.length > 0 ? (
              <p>Service areas: {settings.businessDetails.serviceAreas.join(", ")}</p>
            ) : null}
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">
              {contactContent.mapPlaceholderText}
            </p>
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
    </main>
  );
}
