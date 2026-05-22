"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomerRequestForm } from "@/components/requests/customer-request-form";
import { SiteBrandMark } from "@/components/site-ui/site-brand-mark";
import { SiteCard } from "@/components/site-ui/site-card";
import { SiteCtaPanel } from "@/components/site-ui/site-cta-panel";
import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";
import { SiteServiceGrid } from "@/components/site-ui/site-service-grid";
import { isAppointmentStyleIndustry } from "@/lib/requests/appointment-industries";
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
  const appointmentStyle = isAppointmentStyleIndustry(template.slug);
  const [requestServices] = useState<DemoSiteService[]>(() => resolveActiveServices(template, config.services));
  const localStaff = useMemo<StaffMember[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    return listLocalStaff(template.slug).filter((member) => member.active);
  }, [template.slug]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <section className="rounded-b-3xl border-b border-slate-800 bg-slate-900 px-6 py-8 text-white sm:px-8">
        <SiteBrandMark name={config.businessName} tagline={template.category} dark />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">{config.heroHeadline}</h1>
        <p className="mt-3 max-w-2xl text-slate-200">{config.heroSubheading}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className={primaryButtonClass} type="button">{config.ctaLabel}</button>
          <Link href={`/demo/${template.slug}/customise`} className={secondaryButtonClass}>
            Create my own site
          </Link>
          <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
            Start setup
          </Link>
        </div>
      </section>

      <div className="space-y-6 px-6 py-8 sm:px-8">
        <SiteCard title="Services" subtitle="Tile-based service layout matching your selected industry template.">
          <SiteServiceGrid services={requestServices} />
        </SiteCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SiteCard title="Contact" subtitle={`${config.contact.phone} | ${config.contact.email}`}>
            <p className="text-sm text-slate-600">{config.contact.address}</p>
          </SiteCard>
          <SiteCard title="Opening hours" subtitle={config.openingHours.summary} />
          <SiteCard title="Demo login placeholder" subtitle={`${template.demoLogin.email} / ${template.demoLogin.password}`} />
        </div>

        <SiteCard
          title="Customer and team portal layers (planned)"
          subtitle="Live customer sites will have separate portal access for different users."
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Customer login: bookings, payments, vouchers, profile</li>
            <li>Staff login: appointments, telephone/manual bookings, voucher check and redeem</li>
            <li>Business admin login: services, staff, rota, pages, vouchers and financial reporting</li>
          </ul>
        </SiteCard>

        <SiteCard title="Future workflow support" subtitle="Bookings, quote requests, staff scheduling, completion updates, and review requests can be configured during setup.">
          <p className="text-sm text-slate-600">Email is standard; WhatsApp messaging is optional via add-on.</p>
        </SiteCard>

        {appointmentStyle ? (
          <SiteCard
            title="Gift vouchers (planned module)"
            subtitle="Business admin will be able to enable/disable vouchers and choose delivery methods."
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Choose voucher value and issue a unique voucher ID</li>
              <li>Delivery methods: digital email, collect in store, post (with postage charge)</li>
              <li>Staff can check, redeem, and log voucher usage details</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Payment and delivery integrations are not enabled in this local/mock version.
            </p>
          </SiteCard>
        ) : null}

        <SiteCard
          title={appointmentStyle ? "Book an appointment" : "Example customer request"}
          subtitle={appointmentStyle
            ? "Appointment request prototype using local services, optional preferred staff, and preferred date/time."
            : "This is a local mock form only and does not send real requests."}
        >
          <CustomerRequestForm templateSlug={template.slug} services={requestServices} staffMembers={localStaff} />
        </SiteCard>

        <SiteCtaPanel
          title="Like this direction for your business site?"
          subtitle="Continue customising this draft or move to setup when ready."
          primaryHref={`/setup/${template.slug}`}
          primaryLabel="Start setup"
          secondaryHref={`/demo/${template.slug}/customise`}
          secondaryLabel="Create my own site"
        />

        <SiteFooterBlock
          brand={config.businessName}
          description="Managed local-business website subscription with ongoing support and clear setup workflow."
          groups={[
            {
              title: "Explore",
              links: [
                { label: "Industry page", href: `/${template.slug}` },
                { label: "Customise demo", href: `/demo/${template.slug}/customise` },
              ],
            },
            {
              title: "Setup",
              links: [
                { label: "Start setup", href: `/setup/${template.slug}` },
                { label: "Customer portal (mock)", href: "/account" },
              ],
            },
            {
              title: "Admin",
              links: [
                { label: "Admin portal (mock)", href: "/admin" },
                { label: "Admin settings", href: "/admin/settings" },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}

