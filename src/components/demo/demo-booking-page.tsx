"use client";

import { useMemo } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { CustomerRequestForm } from "@/components/requests/customer-request-form";
import { SiteCard } from "@/components/site-ui/site-card";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate, WebsiteTemplateSlug } from "@/lib/sites/types";
import { listLocalStaff } from "@/lib/staff/local-staff";

type DemoBookingPageProps = {
  template: WebsiteTemplate;
  initialServiceId?: string;
};

export function DemoBookingPage({ template, initialServiceId }: DemoBookingPageProps) {
  const settings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const services = settings.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceLabel: service.priceLabel,
    }));
  const staffMembers = useMemo(() => listLocalStaff(template.slug), [template.slug]);
  const anyCustomerSelectableStaff = staffMembers.some(
    (member) => member.active && member.customerSelectable,
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{template.category}</p>
        <h1 className="mt-2 text-3xl font-bold">Book an appointment</h1>
        <p className="mt-2 text-sm text-slate-200">
          Choose your service, date, and time. Available slots are grouped by morning, afternoon, and evening.
        </p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <SiteCard title="Book your service" subtitle="Select a service tile, then choose date, time, and your details.">
        <CustomerRequestForm
          templateSlug={template.slug as WebsiteTemplateSlug}
          services={services}
          staffMembers={staffMembers}
          initialServiceId={initialServiceId}
        />
        <p className="mt-3 text-xs text-slate-600">
          {anyCustomerSelectableStaff
            ? "Preferred staff selection is available for this site."
            : "This site currently auto-allocates staff after booking review."}
        </p>
      </SiteCard>
    </main>
  );
}
