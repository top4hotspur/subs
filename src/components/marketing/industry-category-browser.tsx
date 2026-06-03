"use client";

import { useState } from "react";
import { IndustryDemoCardCta } from "@/components/marketing/industry-demo-card";
import { WebsiteTemplate, WebsiteTemplateSlug } from "@/lib/sites/types";

type IndustryGroup = {
  title: string;
  description: string;
  slugs: WebsiteTemplateSlug[];
};

type IndustryCategoryBrowserProps = {
  groups: IndustryGroup[];
  templateMap: Map<WebsiteTemplateSlug, WebsiteTemplate>;
};

const GROUP_STYLE_BY_TITLE: Record<
  string,
  {
    activeTabClass: string;
    inactiveTabHoverClass: string;
    activeTabTextSubClass: string;
    cardClass: string;
    cardBorderClass: string;
    cardAccentClass: string;
    bulletClass: string;
  }
> = {
  "Hair, Beauty & Wellness": {
    activeTabClass: "border-cyan-300 bg-cyan-100 text-cyan-950 shadow-sm",
    inactiveTabHoverClass: "hover:bg-cyan-50/80",
    activeTabTextSubClass: "text-cyan-800",
    cardClass: "bg-cyan-50/50",
    cardBorderClass: "border-cyan-100",
    cardAccentClass: "bg-cyan-300",
    bulletClass: "text-cyan-950",
  },
  "Home Services": {
    activeTabClass: "border-emerald-300 bg-emerald-100 text-emerald-950 shadow-sm",
    inactiveTabHoverClass: "hover:bg-emerald-50/80",
    activeTabTextSubClass: "text-emerald-800",
    cardClass: "bg-emerald-50/50",
    cardBorderClass: "border-emerald-100",
    cardAccentClass: "bg-emerald-300",
    bulletClass: "text-emerald-950",
  },
  Transport: {
    activeTabClass: "border-amber-300 bg-amber-100 text-amber-950 shadow-sm",
    inactiveTabHoverClass: "hover:bg-amber-50/80",
    activeTabTextSubClass: "text-amber-800",
    cardClass: "bg-amber-50/50",
    cardBorderClass: "border-amber-100",
    cardAccentClass: "bg-amber-300",
    bulletClass: "text-amber-950",
  },
  Learning: {
    activeTabClass: "border-indigo-300 bg-indigo-100 text-indigo-950 shadow-sm",
    inactiveTabHoverClass: "hover:bg-indigo-50/80",
    activeTabTextSubClass: "text-indigo-800",
    cardClass: "bg-indigo-50/50",
    cardBorderClass: "border-indigo-100",
    cardAccentClass: "bg-indigo-300",
    bulletClass: "text-indigo-950",
  },
};

export function IndustryCategoryBrowser({ groups, templateMap }: IndustryCategoryBrowserProps) {
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.title ?? "");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => {
          const active = activeGroup === group.title;
          const style = GROUP_STYLE_BY_TITLE[group.title];
          return (
            <button
              key={group.title}
              type="button"
              onClick={() => setActiveGroup(group.title)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? style?.activeTabClass ?? "border-sky-700 bg-sky-700 text-white"
                  : `border-slate-300 bg-white text-slate-900 ${style?.inactiveTabHoverClass ?? "hover:bg-slate-50"}`
              }`}
              aria-expanded={active}
            >
              <p className="text-sm font-semibold">{group.title}</p>
              <p className={`mt-1 text-xs ${active ? (style?.activeTabTextSubClass ?? "text-sky-100") : "text-slate-600"}`}>{group.description}</p>
            </button>
          );
        })}
      </div>

      {groups.map((group) => {
        if (group.title !== activeGroup) return null;

        return (
          <div key={group.title} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {group.slugs.map((slug) => {
              const template = templateMap.get(slug);
              if (!template) return null;
              const style = GROUP_STYLE_BY_TITLE[group.title];

              return (
                <article key={template.slug} className={`rounded-2xl border p-5 shadow-sm ${style?.cardClass ?? "bg-white"} ${style?.cardBorderClass ?? "border-slate-200"}`}>
                  <span className={`mb-3 block h-1.5 w-16 rounded-full ${style?.cardAccentClass ?? "bg-slate-400"}`} />
                  <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                  <p className="mt-2 text-sm text-slate-700">{template.marketingSummary}</p>
                  <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm ${style?.bulletClass ?? "text-slate-700"}`}>
                    {template.featureBullets.slice(0, 3).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <IndustryDemoCardCta industrySlug={template.slug} />
                </article>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
