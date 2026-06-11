import { getDefaultDemoConfig } from "@/lib/sites/mock-repository";
import { DemoCustomisationDraft, DemoSiteConfig, WebsiteTemplateSlug } from "@/lib/sites/types";

// Browser-only draft storage for isolated per-prospect demo instances.
// This is temporary local persistence and should move to database-backed storage later.
export const DEMO_DRAFTS_INDEX_KEY = "subs-demo-drafts:index";

function activeDraftKey(templateSlug: WebsiteTemplateSlug): string {
  return `subs-active-demo-draft:${templateSlug}`;
}

function draftStorageKey(draftId: string): string {
  return `subs-demo-draft:${draftId}`;
}

type DraftIndexRecord = {
  id: string;
  templateSlug: WebsiteTemplateSlug;
  draftName: string;
  updatedAtIso: string;
};

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Local demo draft helpers can only run in browser context.");
  }
}

function parseIndex(raw: string | null): DraftIndexRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DraftIndexRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readIndex(): DraftIndexRecord[] {
  ensureBrowser();
  return parseIndex(window.localStorage.getItem(DEMO_DRAFTS_INDEX_KEY));
}

function writeIndex(index: DraftIndexRecord[]): void {
  ensureBrowser();
  window.localStorage.setItem(DEMO_DRAFTS_INDEX_KEY, JSON.stringify(index));
}

function generateDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function templateDisplayName(slug: WebsiteTemplateSlug): string {
  switch (slug) {
    case "taxi":
      return "Taxi Website";
    case "barbers":
      return "Barber Website";
    case "hairdressers":
      return "Hairdresser Website";
    case "beauticians":
      return "Beautician Website";
    case "makeup":
      return "Makeup Artist Website";
    case "nail-salon":
      return "Nail Salon Website";
    case "massage":
      return "Massage Website";
    case "window-cleaning":
      return "Window Cleaning Website";
    case "dog-grooming":
      return "Dog Grooming Website";
    case "driving-instructors":
      return "Driving Instructor Website";
    case "mobile-valeting":
      return "Mobile Valeting Website";
    case "cleaners":
      return "Cleaning Website";
    case "gardeners":
      return "Gardener Website";
    default:
      return "Website";
  }
}

function writeDraft(draft: DemoCustomisationDraft): void {
  ensureBrowser();
  window.localStorage.setItem(draftStorageKey(draft.id), JSON.stringify(draft));

  const index = readIndex();
  const next = index.filter((record) => record.id !== draft.id);
  next.unshift({
    id: draft.id,
    templateSlug: draft.templateSlug,
    draftName: draft.draftName,
    updatedAtIso: draft.updatedAtIso,
  });
  writeIndex(next);
}

export function createLocalDemoDraft(
  templateSlug: WebsiteTemplateSlug,
  initialPatch?: Partial<DemoSiteConfig>,
): DemoCustomisationDraft {
  ensureBrowser();

  const defaultConfig = getDefaultDemoConfig(templateSlug);
  if (!defaultConfig) {
    throw new Error(`Template defaults not found for slug: ${templateSlug}`);
  }

  const now = new Date().toISOString();
  const draft: DemoCustomisationDraft = {
    id: generateDraftId(),
    draftName: `My ${templateDisplayName(templateSlug)} Demo`,
    templateSlug,
    createdAtIso: now,
    updatedAtIso: now,
    config: {
      ...defaultConfig,
      ...initialPatch,
      contact: {
        ...defaultConfig.contact,
        ...(initialPatch?.contact ?? {}),
      },
      openingHours: {
        ...defaultConfig.openingHours,
        ...(initialPatch?.openingHours ?? {}),
      },
      services: initialPatch?.services ?? defaultConfig.services,
    },
  };

  writeDraft(draft);
  return draft;
}

export function getLocalDemoDraft(draftId: string): DemoCustomisationDraft | null {
  ensureBrowser();
  const raw = window.localStorage.getItem(draftStorageKey(draftId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DemoCustomisationDraft;
  } catch {
    return null;
  }
}

export function updateLocalDemoDraft(
  draftId: string,
  patch: {
    draftName?: string;
    config?: Partial<DemoSiteConfig>;
  },
): DemoCustomisationDraft | null {
  ensureBrowser();

  const current = getLocalDemoDraft(draftId);
  if (!current) {
    return null;
  }

  const next: DemoCustomisationDraft = {
    ...current,
    ...patch,
    updatedAtIso: new Date().toISOString(),
    config: patch.config
      ? {
          ...current.config,
          ...patch.config,
          contact: {
            ...current.config.contact,
            ...(patch.config.contact ?? {}),
          },
          openingHours: {
            ...current.config.openingHours,
            ...(patch.config.openingHours ?? {}),
          },
          services: patch.config.services ?? current.config.services,
        }
      : current.config,
  };

  writeDraft(next);
  return next;
}

export function listLocalDemoDrafts(
  templateSlug?: WebsiteTemplateSlug,
): DemoCustomisationDraft[] {
  ensureBrowser();
  const index = readIndex();
  const filtered = templateSlug
    ? index.filter((record) => record.templateSlug === templateSlug)
    : index;

  return filtered
    .map((record) => getLocalDemoDraft(record.id))
    .filter((draft): draft is DemoCustomisationDraft => Boolean(draft));
}

export function getActiveLocalDemoDraftId(
  templateSlug: WebsiteTemplateSlug,
): string | null {
  ensureBrowser();
  return window.localStorage.getItem(activeDraftKey(templateSlug));
}

export function setActiveLocalDemoDraft(
  templateSlug: WebsiteTemplateSlug,
  draftId: string,
): void {
  ensureBrowser();
  window.localStorage.setItem(activeDraftKey(templateSlug), draftId);
}

export function clearLocalDemoDraft(draftId: string): void {
  ensureBrowser();
  const draft = getLocalDemoDraft(draftId);
  window.localStorage.removeItem(draftStorageKey(draftId));

  const next = readIndex().filter((record) => record.id !== draftId);
  writeIndex(next);

  if (draft) {
    const key = activeDraftKey(draft.templateSlug);
    const activeId = window.localStorage.getItem(key);
    if (activeId === draftId) {
      window.localStorage.removeItem(key);
    }
  }
}

export function getOrCreateActiveLocalDemoDraft(
  templateSlug: WebsiteTemplateSlug,
): DemoCustomisationDraft {
  ensureBrowser();
  const activeId = getActiveLocalDemoDraftId(templateSlug);
  if (activeId) {
    const active = getLocalDemoDraft(activeId);
    if (active) {
      return active;
    }
  }

  const created = createLocalDemoDraft(templateSlug);
  setActiveLocalDemoDraft(templateSlug, created.id);
  return created;
}
