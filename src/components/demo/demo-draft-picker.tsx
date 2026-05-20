"use client";

import { useState } from "react";
import {
  createLocalDemoDraft,
  listLocalDemoDrafts,
  setActiveLocalDemoDraft,
  updateLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { DemoCustomisationDraft, WebsiteTemplateSlug } from "@/lib/sites/types";
import { outlineButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type DemoDraftPickerProps = {
  templateSlug: WebsiteTemplateSlug;
  activeDraftId: string;
  onActiveDraftChange: (draft: DemoCustomisationDraft) => void;
};

function formatUpdatedAt(updatedAtIso: string): string {
  const date = new Date(updatedAtIso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown update date";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DemoDraftPicker({ templateSlug, activeDraftId, onActiveDraftChange }: DemoDraftPickerProps) {
  const [, setVersion] = useState(0);
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const drafts: DemoCustomisationDraft[] = typeof window === "undefined" ? [] : listLocalDemoDrafts(templateSlug);
  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) ?? null;

  function refreshDrafts(nextActiveId?: string): void {
    const nextDrafts = listLocalDemoDrafts(templateSlug);
    setVersion((value) => value + 1);
    if (nextDrafts.length === 0) return;

    const target =
      (nextActiveId && nextDrafts.find((draft) => draft.id === nextActiveId)) ??
      nextDrafts.find((draft) => draft.id === activeDraftId) ??
      nextDrafts[0];

    if (!target) return;
    if (target.id !== activeDraftId) {
      setActiveLocalDemoDraft(templateSlug, target.id);
    }
    onActiveDraftChange(target);
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">My demo drafts</h3>
          <p className="text-xs text-slate-500">Browser-only drafts for this industry.</p>
        </div>
        <button type="button" className={`${outlineButtonClass} px-3 py-1.5 text-xs`} onClick={() => {
          const created = createLocalDemoDraft(templateSlug);
          setActiveLocalDemoDraft(templateSlug, created.id);
          refreshDrafts(created.id);
        }}>
          Create new draft
        </button>
      </div>

      {drafts.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          No local drafts found yet. Create one to start customising.
        </p>
      ) : null}

      <div className="space-y-2">
        {drafts.map((draft) => {
          const isActive = draft.id === activeDraftId;
          const isRenaming = renamingDraftId === draft.id;

          return (
            <div key={draft.id} className={`rounded-lg border px-3 py-2 ${isActive ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{draft.draftName}</p>
                  <p className="text-xs text-slate-500">Updated {formatUpdatedAt(draft.updatedAtIso)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isActive ? (
                    <button type="button" className={`${outlineButtonClass} px-2 py-1 text-xs`} onClick={() => {
                      setActiveLocalDemoDraft(templateSlug, draft.id);
                      onActiveDraftChange(draft);
                    }}>
                      Use this draft
                    </button>
                  ) : (
                    <span className="rounded-md bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">Active</span>
                  )}
                  <button type="button" className={`${outlineButtonClass} px-2 py-1 text-xs`} onClick={() => {
                    setRenamingDraftId(draft.id);
                    setRenameValue(draft.draftName);
                  }}>
                    Rename
                  </button>
                </div>
              </div>

              {isRenaming ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input className="min-w-[14rem] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
                  <button type="button" className={`${secondaryButtonClass} px-2 py-1 text-xs`} onClick={() => {
                    const name = renameValue.trim();
                    if (!name) return;
                    const updated = updateLocalDemoDraft(draft.id, { draftName: name });
                    setRenamingDraftId(null);
                    setRenameValue("");
                    if (updated) refreshDrafts(updated.id); else refreshDrafts();
                  }}>
                    Save name
                  </button>
                  <button type="button" className={`${outlineButtonClass} px-2 py-1 text-xs`} onClick={() => {
                    setRenamingDraftId(null);
                    setRenameValue("");
                  }}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {activeDraft ? (
        <p className="text-xs text-slate-500">
          Active draft: <span className="font-medium text-slate-700">{activeDraft.draftName}</span>
        </p>
      ) : null}
    </section>
  );
}
