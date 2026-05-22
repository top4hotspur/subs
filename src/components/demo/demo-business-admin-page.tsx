"use client";

import { useMemo, useState } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
import {
  getLocalCustomerSiteSettings,
  saveLocalCustomerSiteSettings,
} from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import {
  getLocalVoucherSettings,
  saveLocalVoucherSettings,
} from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

type DemoBusinessAdminPageProps = {
  template: WebsiteTemplate;
};

const permissionAreas = [
  "staff",
  "rotas",
  "bookings",
  "financials",
  "services",
  "vouchers",
  "pages",
  "notifications",
] as const;

export function DemoBusinessAdminPage({ template }: DemoBusinessAdminPageProps) {
  const initialSettings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const [settings, setSettings] = useState(initialSettings);
  const [voucherSettings, setVoucherSettings] = useState(
    getLocalVoucherSettings(template.slug),
  );
  const [superUserPermissions, setSuperUserPermissions] = useState<Record<string, boolean>>(
    Object.fromEntries(permissionAreas.map((area) => [area, true])),
  );
  const [message, setMessage] = useState<string | null>(null);

  function persistSettings(): void {
    saveLocalCustomerSiteSettings(settings);
    saveLocalVoucherSettings(template.slug, voucherSettings);
    setMessage("Business site settings saved.");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Business admin portal</p>
        <h1 className="mt-2 text-3xl font-bold">Site owner control centre</h1>
        <p className="mt-2 text-sm text-slate-200">
          Manage services, staff setup, booking preferences, vouchers, pages, and team permissions.
        </p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <SiteCard title="Services and prices" subtitle="Configure service list, pricing and booking durations.">
          <ul className="space-y-2 text-sm text-slate-700">
            {settings.services
              .filter((service) => service.active)
              .slice(0, 8)
              .map((service) => (
                <li key={service.id}>
                  {service.name} - {service.priceLabel || (service.basePriceGbp ? `£${service.basePriceGbp}` : "Price set in editor")}
                </li>
              ))}
          </ul>
        </SiteCard>

        <SiteCard title="Staff and booking preferences" subtitle="Control staff selection and rota behaviour.">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.sectionVisibility.bookingCta.enabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  sectionVisibility: {
                    ...current.sectionVisibility,
                    bookingCta: {
                      ...current.sectionVisibility.bookingCta,
                      enabled: event.target.checked,
                    },
                  },
                }))
              }
            />
            Booking calls-to-action enabled
          </label>
          <p className="mt-2 text-xs text-slate-600">
            Staff selection visibility is controlled by customer-selectable staff settings in team setup.
          </p>
        </SiteCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SiteCard title="Gift vouchers" subtitle="Enable vouchers and configure delivery methods.">
          <div className="space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voucherSettings.enabled}
                onChange={(event) =>
                  setVoucherSettings((current) => ({ ...current, enabled: event.target.checked }))
                }
              />
              Enable gift vouchers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={voucherSettings.allowCustomValue}
                onChange={(event) =>
                  setVoucherSettings((current) => ({ ...current, allowCustomValue: event.target.checked }))
                }
              />
              Allow customer-entered voucher values
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={voucherSettings.minValueGbp}
                onChange={(event) =>
                  setVoucherSettings((current) => ({
                    ...current,
                    minValueGbp: Number(event.target.value || 0),
                  }))
                }
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={voucherSettings.maxValueGbp}
                onChange={(event) =>
                  setVoucherSettings((current) => ({
                    ...current,
                    maxValueGbp: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <div className="space-y-1 text-xs">
              {[VoucherDeliveryMethod.DIGITAL_EMAIL, VoucherDeliveryMethod.COLLECT_IN_STORE, VoucherDeliveryMethod.POST].map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voucherSettings.deliveryMethods.includes(method)}
                    onChange={(event) =>
                      setVoucherSettings((current) => ({
                        ...current,
                        deliveryMethods: event.target.checked
                          ? [...current.deliveryMethods, method]
                          : current.deliveryMethods.filter((item) => item !== method),
                      }))
                    }
                  />
                  {method}
                </label>
              ))}
            </div>
            <label className="text-xs">
              Postage charge
              <input
                type="number"
                step="0.5"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={voucherSettings.postageChargeGbp}
                onChange={(event) =>
                  setVoucherSettings((current) => ({
                    ...current,
                    postageChargeGbp: Number(event.target.value || 0),
                  }))
                }
              />
            </label>
          </div>
        </SiteCard>

        <SiteCard title="Page visibility and content" subtitle="Enable pages and maintain core About/Contact content.">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.pageVisibility.about.enabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  pageVisibility: {
                    ...current.pageVisibility,
                    about: { ...current.pageVisibility.about, enabled: event.target.checked },
                  },
                }))
              }
            />
            About Us page enabled
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settings.pageVisibility.contact.enabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  pageVisibility: {
                    ...current.pageVisibility,
                    contact: { ...current.pageVisibility.contact, enabled: event.target.checked },
                  },
                }))
              }
            />
            Contact page enabled
          </label>
          <p className="mt-2 text-xs text-slate-600">
            About and Contact content uses the business profile, service areas, and contact details configured for this site.
          </p>
        </SiteCard>
      </div>

      <SiteCard title="Super-user permissions model" subtitle="Choose which areas delegated users can access.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {permissionAreas.map((area) => (
            <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(superUserPermissions[area])}
                onChange={(event) =>
                  setSuperUserPermissions((current) => ({ ...current, [area]: event.target.checked }))
                }
              />
              {area}
            </label>
          ))}
        </div>
      </SiteCard>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          onClick={persistSettings}
        >
          Save business settings
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </main>
  );
}

