"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { DemoPreview } from "@/components/demo/demo-preview";
import { updateDemoDraft } from "@/lib/sites/mock-repository";
import { DemoCustomisationDraft, DemoSiteService, WebsiteTemplate } from "@/lib/sites/types";

type DemoCustomizerProps = {
  template: WebsiteTemplate;
  initialDraft: DemoCustomisationDraft;
};

function getStorageKey(slug: WebsiteTemplate["slug"]): string {
  return `subs-demo-draft:${slug}`;
}

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
    `Business: ${config.businessName}`,
    `Contact: ${config.contact.phone} | ${config.contact.email}`,
    `Location: ${config.contact.address}`,
    `Hero: ${config.heroHeadline}`,
    `Services: ${config.services.map((service) => service.name).join(", ")}`,
    `Opening hours: ${config.openingHours.summary}`,
    `Pricing: £149 setup; £30/month base; optional add-ons in setup`,
  ].join("\n");
}

function hydrateDraft(
  template: WebsiteTemplate,
  initialDraft: DemoCustomisationDraft,
): DemoCustomisationDraft {
  if (typeof window === "undefined") {
    return initialDraft;
  }

  const raw = window.localStorage.getItem(getStorageKey(template.slug));
  if (!raw) {
    return initialDraft;
  }

  try {
    const parsedDraft = JSON.parse(raw) as DemoCustomisationDraft;
    if (parsedDraft.slug === template.slug) {
      return parsedDraft;
    }
  } catch {
    // Ignore malformed browser-only draft data.
  }

  return initialDraft;
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
    window.localStorage.setItem(getStorageKey(template.slug), JSON.stringify(nextDraft));
    setIsSaved(true);
    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => setIsSaved(false), 1800);
  }

  function applyPatch(patch: Parameters<typeof updateDemoDraft>[1]): void {
    persistDraft(updateDemoDraft(draft, patch));
  }

  const config = draft.config;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Customisation panel</h2>
            <p className="text-sm text-slate-600">Browser-only demo draft editing.</p>
          </div>
          <span className="text-xs font-medium text-emerald-700">
            {isSaved ? "Saved in this browser" : " "}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            onClick={() => {
              window.localStorage.removeItem(getStorageKey(template.slug));
              setDraft(initialDraft);
              setIsSaved(false);
            }}
          >
            Reset demo
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
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
          <Link
            href={`/setup/${template.slug}`}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Start setup
          </Link>
          <span className="text-xs text-slate-500">
            {copyState === "copied"
              ? "Summary copied"
              : copyState === "error"
                ? "Copy failed"
                : " "}
          </span>
        </div>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Brand</h3>
          <label className="block text-sm font-medium text-slate-700">
            Business name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.businessName}
              onChange={(event) => applyPatch({ businessName: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Primary colour
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 p-1"
                value={config.primaryColor}
                onChange={(event) => applyPatch({ primaryColor: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Accent colour
              <input
                type="color"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 p-1"
                value={config.accentColor}
                onChange={(event) => applyPatch({ accentColor: event.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.contact.phone}
              onChange={(event) =>
                applyPatch({ contact: { ...config.contact, phone: event.target.value } })
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.contact.email}
              onChange={(event) =>
                applyPatch({ contact: { ...config.contact, email: event.target.value } })
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Address / location
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.contact.address}
              onChange={(event) =>
                applyPatch({ contact: { ...config.contact, address: event.target.value } })
              }
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Homepage text</h3>
          <label className="block text-sm font-medium text-slate-700">
            Hero headline
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.heroHeadline}
              onChange={(event) => applyPatch({ heroHeadline: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Hero subheading
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.heroSubheading}
              onChange={(event) => applyPatch({ heroSubheading: event.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Call-to-action label
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.ctaLabel}
              onChange={(event) => applyPatch({ ctaLabel: event.target.value })}
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Services</h3>
          <label className="block text-sm font-medium text-slate-700">
            Services list (one per line)
            <textarea
              className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={servicesInput}
              onChange={(event) => applyPatch({ services: parseServices(event.target.value) })}
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Opening hours</h3>
          <label className="block text-sm font-medium text-slate-700">
            Hours summary
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={config.openingHours.summary}
              onChange={(event) => applyPatch({ openingHours: { summary: event.target.value } })}
            />
          </label>
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
