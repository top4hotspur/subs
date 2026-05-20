import Link from "next/link";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";

type DemoPreviewProps = {
  template: WebsiteTemplate;
  draft: DemoCustomisationDraft;
};

export function DemoPreview({ template, draft }: DemoPreviewProps) {
  const { config } = draft;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-8" style={{ backgroundColor: config.primaryColor }}>
        <p className="text-sm font-medium text-white/85">{template.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{config.businessName}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{config.heroHeadline}</p>
        <p className="mt-1 text-white/80">{config.heroSubheading}</p>
        <button
          className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: config.accentColor }}
          type="button"
        >
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
          <Link
            href={`/demo/${template.slug}/customise`}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Open Customisation Area
          </Link>
          <Link
            href={`/setup/${template.slug}`}
            className="inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Start setup
          </Link>
        </div>
      </div>
    </div>
  );
}
