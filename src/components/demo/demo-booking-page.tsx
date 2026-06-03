"use client";

import { useState } from "react";
import { DemoPreview } from "@/components/demo/demo-preview";
import { DemoSiteIntroBanner } from "@/components/demo/demo-site-intro-banner";
import {
  getActiveLocalDemoDraftId,
  getLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";

type DemoBookingPageProps = {
  template: WebsiteTemplate;
  defaultDraft: DemoCustomisationDraft;
  initialServiceId?: string;
};

export function DemoBookingPage({
  template,
  defaultDraft,
  initialServiceId,
}: DemoBookingPageProps) {
  const [activeDraft] = useState<DemoCustomisationDraft | null>(() => {
    if (typeof window === "undefined") return null;
    const activeId = getActiveLocalDemoDraftId(template.slug);
    return activeId ? getLocalDemoDraft(activeId) : null;
  });
  const previewDraft = activeDraft ?? defaultDraft;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <DemoSiteIntroBanner template={template} />
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
        <p className="font-semibold">Demo booking preview</p>
        <p className="mt-1">
          This mirrors the live customer booking journey, but it is demo-safe: no real tenant booking,
          payment or customer record is created.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Website preview starts here</p>
        <div className="h-px flex-1 bg-slate-300" />
      </div>
      <DemoPreview
        template={template}
        draft={previewDraft}
        initialServiceId={initialServiceId}
      />
    </main>
  );
}
