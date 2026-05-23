"use client";

import { useMemo } from "react";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
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
    <DemoSitePageShell template={template} settings={settings}>
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
    </DemoSitePageShell>
  );
}
