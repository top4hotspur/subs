"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomerRequestForm } from "@/components/requests/customer-request-form";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { listLocalStaff } from "@/lib/staff/local-staff";
import { StaffMember } from "@/lib/staff/staff-types";
import { DemoCustomisationDraft, DemoSiteService, WebsiteTemplate } from "@/lib/sites/types";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
};

function resolveActiveServices(template: WebsiteTemplate, draftServices: DemoSiteService[]): DemoSiteService[] {
  if (typeof window === "undefined") {
    return draftServices;
  }

  const settings = getLocalCustomerSiteSettings(template.slug, template);
  const active = settings.services
    .filter((service) => service.active)
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceLabel: service.priceLabel,
    }));

  return active.length > 0 ? active : draftServices;
}

export function DemoPreview({ template, draft }: DemoPreviewProps) {
  const { config } = draft;
  const [requestServices] = useState<DemoSiteService[]>(() => resolveActiveServices(template, config.services));
  const localStaff = useMemo<StaffMember[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    return listLocalStaff(template.slug).filter((member) => member.active);
  }, [template.slug]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-8" style={{ backgroundColor: config.primaryColor }}>
        <p className="text-sm font-medium text-white/85">{template.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{config.businessName}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{config.heroHeadline}</p>
        <p className="mt-1 text-white/80">{config.heroSubheading}</p>
        <button className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: config.accentColor }} type="button">
          {config.ctaLabel}
        </button>
      </div>

      <div className="grid gap-6 p-8 sm:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Services</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {config.services.map((service) => (
              <li key={service.id} className="rounded-md border border-slate-200 px-3 py-2">
                {service.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-600">
          <div>
            <h2 className="font-semibold text-slate-900">Contact</h2>
            <p>{config.contact.phone}</p>
            <p>{config.contact.email}</p>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Opening hours</h2>
            <p>{config.openingHours.summary}</p>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Location</h2>
            <p>{config.contact.address}</p>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-8 py-4">
        <div className="text-xs text-slate-500">
          Demo login: {template.demoLogin.email} / {template.demoLogin.password}
        </div>
        <div className="flex gap-2">
          <Link href={`/demo/${template.slug}/customise`} className={secondaryButtonClass}>
            Customise my demo
          </Link>
          <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
            Start setup
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-8 py-4 text-xs text-slate-600">
        Future workflow support can include bookings/quote requests, staff and calendar tools, job completion updates,
        and review request messaging. Email is standard, with optional WhatsApp add-on messaging.
      </div>

      <div className="border-t border-slate-200 bg-white px-8 py-4">
        <CustomerRequestForm templateSlug={template.slug} services={requestServices} staffMembers={localStaff} />
      </div>
    </div>
  );
}

