"use client";

import { useState } from "react";
import { DemoPreview } from "@/components/demo/demo-preview";
import {
  getActiveLocalDemoDraftId,
  getLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";

type DemoPageClientProps = {
  template: WebsiteTemplate;
  defaultDraft: DemoCustomisationDraft;
};

export function DemoPageClient({ template, defaultDraft }: DemoPageClientProps) {
  const [activeDraft] = useState<DemoCustomisationDraft | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const activeId = getActiveLocalDemoDraftId(template.slug);
    if (!activeId) {
      return null;
    }

    return getLocalDemoDraft(activeId);
  });
  const hasActiveDraft = Boolean(activeDraft);
  const previewDraft = hasActiveDraft ? activeDraft! : defaultDraft;

  return (
    <div className="space-y-4">
      {hasActiveDraft ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 shadow-sm">
          <p className="font-semibold">
            Showing your customised demo draft: {activeDraft?.draftName}
          </p>
          <p className="mt-1 text-sky-800">
            The live site preview below reflects your latest saved draft.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          <p>
            You are viewing the default subscriber-site template preview.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Website preview starts here</p>
        <div className="h-px flex-1 bg-slate-300" />
      </div>

      <DemoPreview template={template} draft={previewDraft} />
    </div>
  );
}

