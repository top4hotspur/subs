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

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{template.category}</p>
        <h1 className="mt-2 text-3xl font-bold">{isAbout ? "About us" : "Contact"}</h1>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      {isAbout ? (
        <SiteCard title={settings.businessDetails.businessName} subtitle="Local team focused on reliable service and repeat customers.">
          <p className="text-sm text-slate-700">
            We deliver consistent quality, clear communication, and friendly service across our local area.
            Our team supports regular and one-off bookings with a simple online booking journey.
          </p>
        </SiteCard>
      ) : (
        <SiteCard title="Get in touch" subtitle="Call, email, or send a booking request online.">
          <div className="space-y-2 text-sm text-slate-700">
            <p>Phone: {settings.businessDetails.phone}</p>
            <p>Email: {settings.businessDetails.email}</p>
            {settings.businessDetails.address ? <p>Address: {settings.businessDetails.address}</p> : null}
            {settings.businessDetails.serviceAreas.length > 0 ? (
              <p>Service areas: {settings.businessDetails.serviceAreas.join(", ")}</p>
            ) : null}
          </div>
        </SiteCard>
      )}
    </main>
  );
}

