import { InStoreSale } from "@/lib/payments/payment-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

function key(slug: WebsiteTemplateSlug): string {
  return `subs-instore-sales:${slug}`;
}

function parse(raw: string | null): InStoreSale[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as InStoreSale[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listLocalInStoreSales(industrySlug: WebsiteTemplateSlug): InStoreSale[] {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(key(industrySlug))).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export function createLocalInStoreSale(
  industrySlug: WebsiteTemplateSlug,
  input: Omit<InStoreSale, "id" | "industrySlug" | "createdAtIso">,
): InStoreSale {
  const sale: InStoreSale = {
    ...input,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sale_${Date.now()}`,
    industrySlug,
    createdAtIso: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    const current = listLocalInStoreSales(industrySlug);
    current.unshift(sale);
    window.localStorage.setItem(key(industrySlug), JSON.stringify(current));
  }
  return sale;
}
