"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { DemoDraftPicker } from "@/components/demo/demo-draft-picker";
import { DemoPreview } from "@/components/demo/demo-preview";
import {
  getOrCreateActiveLocalDemoDraft,
  updateLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { getDefaultDemoConfig } from "@/lib/sites/mock-repository";
import {
  DemoCustomisationDraft,
  DemoSiteConfig,
  DemoSiteService,
  WebsiteTemplate,
} from "@/lib/sites/types";
import {
  outlineButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui/button-styles";

type DemoCustomizerProps = {
  template: WebsiteTemplate;
  initialDraft: DemoCustomisationDraft;
};

function parseServices(input: string): DemoSiteService[] {
  return input
    .split("\n")
    .map((service) => service.trim())
    .filter(Boolean)
    .map((name, index) => ({ id: `service-${index + 1}`, name }));
}


function buildDemoSummary(template: WebsiteTemplate, draft: DemoCustomisationDraft): string {
  const { config } = draft;
  return [
    `Template: ${template.name}`,
    `Demo name: ${draft.draftName}`,
    `Business: ${config.businessName}`,
    `Contact: ${config.contact.phone} | ${config.contact.email}`,
    `Location: ${config.contact.address}`,
    `Hero: ${config.heroHeadline}`,
    `Services: ${config.services.map((service) => service.name).join(", ")}`,
    `Opening hours: ${config.openingHours.summary}`,
    `Pricing: GBP149 setup; GBP30/month base package`,
  ].join("\n");
}

function hydrateDraft(
  template: WebsiteTemplate,
  initialDraft: DemoCustomisationDraft,
): DemoCustomisationDraft {
  if (typeof window === "undefined") {
    return initialDraft;
  }

  try {
    return getOrCreateActiveLocalDemoDraft(template.slug);
  } catch {
    return initialDraft;
  }
}

export function DemoCustomizer({ template, initialDraft }: DemoCustomizerProps) {
  const [draft, setDraft] = useState<DemoCustomisationDraft>(() =>
    hydrateDraft(template, initialDraft),
  );
  const [isSaved, setIsSaved] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const savedTimerRef = useRef<number | null>(null);

  const servicesInput = draft.config.services.map((service) => service.name).join("\n");
  const summary = useMemo(() => buildDemoSummary(template, draft), [template, draft]);

  function persistDraft(nextDraft: DemoCustomisationDraft): void {
    setDraft(nextDraft);
    setIsSaved(true);
    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => setIsSaved(false), 1800);
  }

  type DemoDraftPatch = {
    draftName?: string;
    config?: Partial<DemoSiteConfig>;
  };

  function applyPatch(patch: DemoDraftPatch): void {
    const updated = updateLocalDemoDraft(draft.id, patch);
    if (updated) {
      persistDraft(updated);
    }
  }

  const config = draft.config;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create my own site</h1>
            <p className="mt-1 text-sm text-slate-600">
              Add the key details now. We will use these to prepare your website setup.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              You can add services, pricing, staff and operational setup later in the business admin area.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700">
            {isSaved ? "Saved in this browser" : " "}
          </span>
        </div>

        <DemoDraftPicker
          templateSlug={template.slug}
          activeDraftId={draft.id}
          onActiveDraftChange={(nextDraft) => {
            setDraft(nextDraft);
            setIsSaved(false);
          }}
        />

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Core business details</h2>

          <label className="block text-sm font-medium text-slate-700">
            Demo/site name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={draft.draftName}
              onChange={(event) => applyPatch({ draftName: event.target.value })}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Business name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.businessName}
              onChange={(event) =>
                applyPatch({ config: { businessName: event.target.value } })
              }
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Phone number
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={config.contact.phone}
                onChange={(event) =>
                  applyPatch({
                    config: { contact: { ...config.contact, phone: event.target.value } },
                  })
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={config.contact.email}
                onChange={(event) =>
                  applyPatch({
                    config: { contact: { ...config.contact, email: event.target.value } },
                  })
                }
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Address / service area
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.contact.address}
              onChange={(event) =>
                applyPatch({
                  config: { contact: { ...config.contact, address: event.target.value } },
                })
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Hero headline
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.heroHeadline}
              onChange={(event) =>
                applyPatch({ config: { heroHeadline: event.target.value } })
              }
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Hero subheading
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.heroSubheading}
              onChange={(event) =>
                applyPatch({ config: { heroSubheading: event.target.value } })
              }
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Operational setup tools</h2>
          <p className="text-xs text-slate-600">
            Services, staff, pricing and CSV import/export tools are available in the business admin area after this step.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Services preview</h2>
          <p className="text-xs text-slate-600">One service per line. You can add as many as needed.</p>
          <textarea
            className="mt-1 min-h-44 w-full resize-y rounded-lg border border-slate-300 px-3 py-2"
            value={servicesInput}
            onChange={(event) =>
              applyPatch({ config: { services: parseServices(event.target.value) } })
            }
            placeholder="Example:\nHaircut\nBeard trim\nSkin fade"
          />
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">What you can customise during setup</h2>
          <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
            {[
              "Services and pricing",
              "Staff and roles",
              "Opening hours and availability",
              "Policies and FAQs",
              "Gallery and reviews",
              "Notification templates",
            ].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                {item} - editable during setup
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Next: complete setup details</p>
          <p className="text-xs text-slate-600">
            Choose domain option, confirm customer communications, review setup/monthly pricing, and continue to payment when payments are enabled.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/setup/${template.slug}`} className={primaryButtonClass}>
              Continue to setup
            </Link>
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => {
                const defaults = getDefaultDemoConfig(template.slug);
                if (!defaults) return;
                const updated = updateLocalDemoDraft(draft.id, { config: defaults });
                if (updated) persistDraft(updated);
              }}
            >
              Reset this demo
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(summary);
                  setCopyState("copied");
                } catch {
                  setCopyState("error");
                }
                window.setTimeout(() => setCopyState("idle"), 1500);
              }}
            >
              Copy demo summary
            </button>
            <span className="text-xs text-slate-500">
              {copyState === "copied"
                ? "Summary copied"
                : copyState === "error"
                  ? "Copy failed"
                  : " "}
            </span>
          </div>
        </section>
      </aside>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-900">Demo login placeholder</p>
          <p>{template.demoLogin.email}</p>
          <p>{template.demoLogin.password}</p>
        </div>
        <DemoPreview template={template} draft={draft} />
      </div>
    </div>
  );
}
