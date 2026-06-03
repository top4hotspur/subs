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
    activeTabClass: "border-[#D8AEB4] bg-[#FCEAEA] text-[#5F2D35] shadow-sm",
    inactiveTabHoverClass: "hover:bg-[#FCEAEA]",
    activeTabTextSubClass: "text-[#7A3E46]",
    cardClass: "bg-[#FCEAEA]",
    cardBorderClass: "border-[#E8C8CC]",
    cardAccentClass: "bg-[#9B5A64]",
    bulletClass: "text-[#5F2D35]",
  },
  "Home Services": {
    activeTabClass: "border-[#B8D5C1] bg-[#E8F4EC] text-[#284B35] shadow-sm",
    inactiveTabHoverClass: "hover:bg-[#E8F4EC]",
    activeTabTextSubClass: "text-[#3F6F4E]",
    cardClass: "bg-[#E8F4EC]",
    cardBorderClass: "border-[#C7E0CF]",
    cardAccentClass: "bg-[#5F8A6C]",
    bulletClass: "text-[#284B35]",
  },
  Transport: {
    activeTabClass: "border-[#E5CFA5] bg-[#FDF3E1] text-[#5C4320] shadow-sm",
    inactiveTabHoverClass: "hover:bg-[#FDF3E1]",
    activeTabTextSubClass: "text-[#7A5A2B]",
    cardClass: "bg-[#FDF3E1]",
    cardBorderClass: "border-[#ECD7B1]",
    cardAccentClass: "bg-[#A67835]",
    bulletClass: "text-[#5C4320]",
  },
  Learning: {
    activeTabClass: "border-[#C9CEE3] bg-[#ECEEF6] text-[#30384F] shadow-sm",
    inactiveTabHoverClass: "hover:bg-[#ECEEF6]",
    activeTabTextSubClass: "text-[#4E5876]",
    cardClass: "bg-[#ECEEF6]",
    cardBorderClass: "border-[#D2D7E8]",
    cardAccentClass: "bg-[#66708F]",
    bulletClass: "text-[#30384F]",
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
              className={`rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
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
                <article key={template.slug} className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style?.cardClass ?? "bg-white"} ${style?.cardBorderClass ?? "border-slate-200"}`}>
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
