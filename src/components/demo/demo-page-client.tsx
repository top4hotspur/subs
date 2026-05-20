"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoPreview } from "@/components/demo/demo-preview";
import {
  getActiveLocalDemoDraftId,
  getLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { DemoCustomisationDraft, WebsiteTemplate } from "@/lib/sites/types";
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

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
  const [viewMode, setViewMode] = useState<"active" | "default">("active");

  const hasActiveDraft = Boolean(activeDraft);
  const showingDefault = !hasActiveDraft || viewMode === "default";
  const previewDraft = showingDefault ? defaultDraft : activeDraft!;

  return (
    <div className="space-y-4">
      {hasActiveDraft ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">
            Showing your customised demo draft: {activeDraft?.draftName}
          </p>
          <p className="mt-1 text-sky-800">
            You can switch between your active draft and the default template at any time.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/demo/${template.slug}/customise`} className={primaryButtonClass}>
              Continue editing
            </Link>
            <Link href={`/setup/${template.slug}`} className={secondaryButtonClass}>
              Start setup
            </Link>
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => setViewMode((mode) => (mode === "active" ? "default" : "active"))}
            >
              {showingDefault ? "View my active draft" : "View default template demo"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <p>
            You are viewing the default template demo. Create your own version to personalise it.
          </p>
          <div className="mt-3">
            <Link href={`/demo/${template.slug}/customise`} className={secondaryButtonClass}>
              Customise my demo
            </Link>
          </div>
        </div>
      )}

      <DemoPreview template={template} draft={previewDraft} />
    </div>
  );
}
