export type SalesLeadImportSourceType = "Booksy" | "Google Maps" | "Facebook" | "Manual" | "Other";

export type ExtractLeadImportRowInput = {
  sourceUrl: string;
  sourceType?: string | null;
  defaultIndustrySlug?: string | null;
  defaultCityTown?: string | null;
};

export type ExtractedLeadImportRow = {
  sourceUrl: string;
  extractedBusinessName?: string;
  extractedAddress?: string;
  extractedPostcode?: string;
  extractedPhone?: string;
  extractedWebsite?: string;
  extractedEmail?: string;
  leadSource?: string;
  currentProvider?: string;
  estimatedCurrentMonthlyCost?: number;
  industrySlug?: string;
  cityTown?: string;
  status: "PENDING_REVIEW" | "NEEDS_ENRICHMENT";
  emailEnrichmentStatus: "Missing email" | "Website found" | "Email found" | "Needs manual research" | "Do not contact";
  notes?: string;
  raw: Record<string, unknown>;
};

const BOOKSY_HOST_PARTS = ["booksy.com", "booksy.net", "booksy.co.uk"];

function cleanText(value?: string | null): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function detectSourceType(url: URL, explicitSourceType?: string | null): SalesLeadImportSourceType {
  if (explicitSourceType && explicitSourceType !== "Other") return explicitSourceType as SalesLeadImportSourceType;
  const host = url.hostname.toLowerCase();
  if (BOOKSY_HOST_PARTS.some((part) => host === part || host.endsWith(`.${part}`))) return "Booksy";
  if (host.includes("google.") || host.includes("goo.gl") || host.includes("maps.app.goo.gl")) return "Google Maps";
  if (host.includes("facebook.") || host.includes("fb.com")) return "Facebook";
  return explicitSourceType === "Manual" ? "Manual" : "Other";
}

function extractNameFromPath(url: URL): string | undefined {
  const parts = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter(Boolean);
  const candidate = parts
    .filter((part) => !["search", "business", "biz", "booking", "appointments"].includes(part.toLowerCase()))
    .at(-1);
  if (!candidate) return undefined;
  const withoutNumericSuffix = candidate.replace(/[-_]\d+$/, "");
  return withoutNumericSuffix
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function extractLeadImportRow(input: ExtractLeadImportRowInput): ExtractedLeadImportRow {
  const sourceUrl = input.sourceUrl.trim();
  const defaults = {
    industrySlug: cleanText(input.defaultIndustrySlug),
    cityTown: cleanText(input.defaultCityTown),
  };

  try {
    const url = new URL(sourceUrl);
    const sourceType = detectSourceType(url, input.sourceType);
    const isBooksy = sourceType === "Booksy";
    const isProfileLike = url.pathname.split("/").filter(Boolean).length > 1;
    const businessName = isProfileLike ? extractNameFromPath(url) : undefined;
    const website = sourceType === "Manual" || sourceType === "Other" ? url.origin : undefined;

    return {
      sourceUrl,
      extractedBusinessName: businessName,
      extractedWebsite: website,
      leadSource: sourceType,
      currentProvider: isBooksy ? "Booksy" : undefined,
      estimatedCurrentMonthlyCost: isBooksy ? 40 : undefined,
      industrySlug: defaults.industrySlug,
      cityTown: defaults.cityTown,
      status: businessName ? "PENDING_REVIEW" : "NEEDS_ENRICHMENT",
      emailEnrichmentStatus: website ? "Website found" : "Missing email",
      notes: businessName
        ? "Review visible source details before approving."
        : "Source URL queued for enrichment or manual review.",
      raw: {
        host: url.hostname,
        path: url.pathname,
        search: url.search,
        sourceType,
        strategy: isBooksy ? "booksy-url-defaults" : "url-only",
      },
    };
  } catch {
    return {
      sourceUrl,
      leadSource: cleanText(input.sourceType) || "Other",
      industrySlug: defaults.industrySlug,
      cityTown: defaults.cityTown,
      status: "NEEDS_ENRICHMENT",
      emailEnrichmentStatus: "Needs manual research",
      notes: "Invalid URL. Review and edit before approval.",
      raw: { parseError: "INVALID_URL" },
    };
  }
}
