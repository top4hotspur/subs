"use client";

import { useState } from "react";
import { IndustryDemoCardCta } from "@/components/marketing/industry-demo-card";
import { SiteCard } from "@/components/site-ui/site-card";
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

export function IndustryCategoryBrowser({ groups, templateMap }: IndustryCategoryBrowserProps) {
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.title ?? "");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => {
          const active = activeGroup === group.title;
          return (
            <button
              key={group.title}
              type="button"
              onClick={() => setActiveGroup(group.title)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-sky-700 bg-sky-700 text-white"
                  : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              }`}
              aria-expanded={active}
            >
              <p className="text-sm font-semibold">{group.title}</p>
              <p className={`mt-1 text-xs ${active ? "text-sky-100" : "text-slate-600"}`}>{group.description}</p>
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

              return (
                <SiteCard key={template.slug} title={template.name} subtitle={template.marketingSummary}>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {template.featureBullets.slice(0, 3).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <IndustryDemoCardCta industrySlug={template.slug} />
                </SiteCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
