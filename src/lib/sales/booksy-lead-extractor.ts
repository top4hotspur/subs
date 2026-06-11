import type { ExtractedLeadImportRow } from "@/lib/sales/lead-import-extractor";

type BooksyExtractInput = {
  sourceUrl: string;
  defaultIndustrySlug?: string | null;
  defaultCityTown?: string | null;
};

type BooksyListing = {
  businessName: string;
  profileUrl: string;
  address?: string;
  postcode?: string;
  cityTown?: string;
  phone?: string;
  ratingValue?: number;
  reviewCount?: number;
  category?: string;
  sponsoredStatus: "Sponsored" | "Not sponsored" | "Unknown";
};

type BooksyExtractResult = {
  rows: ExtractedLeadImportRow[];
  extractedCount: number;
  sponsoredSkippedCount: number;
  fetchedUrl?: string;
  fallbackReason?: string;
};

const BOOKSY_HOST_PARTS = ["booksy.com", "booksy.net", "booksy.co.uk"];
const UK_POSTCODE_PATTERN = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;

function cleanText(value?: string | null): string | undefined {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

function isBooksyUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  return BOOKSY_HOST_PARTS.some((part) => host === part || host.endsWith(`.${part}`));
}

function buildRobotsRespectingUrl(sourceUrl: string): URL | null {
  try {
    const url = new URL(sourceUrl);
    if (!isBooksyUrl(url)) return null;
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function absoluteBooksyUrl(value: string, baseUrl: URL): string {
  return new URL(value.replace(/#.*$/, ""), baseUrl.origin).toString();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractPostcode(value?: string): string | undefined {
  const match = value?.match(UK_POSTCODE_PATTERN);
  return match ? match[0].toUpperCase().replace(/\s+/, " ") : undefined;
}

function extractCityTown(address?: string, fallback?: string | null): string | undefined {
  const fallbackCity = cleanText(fallback);
  if (fallbackCity) return fallbackCity;
  const postcode = extractPostcode(address);
  if (!address || !postcode) return undefined;
  const postcodeIndex = address.toUpperCase().indexOf(postcode.replace(/\s+/, " "));
  if (postcodeIndex < 0) return undefined;
  const afterPostcode = address.slice(postcodeIndex + postcode.length);
  const parts = afterPostcode.split(",").map((part) => cleanText(part)).filter(Boolean);
  return parts[0];
}

function extractCategoryFromUrl(profileUrl: string): string | undefined {
  const pathPart = profileUrl.split("/").at(-1)?.split("#")[0] ?? "";
  const pieces = pathPart.split("_").filter(Boolean);
  if (pieces.length < 3) return undefined;
  return pieces[pieces.length - 2]?.replace(/-/g, " ");
}

function extractBusinessId(profileUrl: string): string | undefined {
  const pathPart = profileUrl.split("/").at(-1) ?? "";
  return pathPart.match(/^(\d+)_/)?.[1];
}

function findSponsoredStatus(html: string, profileUrl: string): "Sponsored" | "Not sponsored" | "Unknown" {
  const businessId = extractBusinessId(profileUrl);
  if (!businessId) return "Unknown";
  const itemPattern = new RegExp(`data-business-id=["']${businessId}["'][\\s\\S]{0,300}?data-is-blisting=["'](true|false)["']`, "i");
  const match = html.match(itemPattern);
  if (!match) return "Unknown";
  return match[1].toLowerCase() === "true" ? "Sponsored" : "Not sponsored";
}

function parseJsonLdListings(html: string, baseUrl: URL): BooksyListing[] {
  const listings: BooksyListing[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const jsonText = decodeHtmlEntities(match[1].trim());
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      continue;
    }
    const itemListElement = (parsed as { itemListElement?: unknown }).itemListElement;
    if (!Array.isArray(itemListElement)) continue;
    for (const element of itemListElement) {
      const item = (element as { item?: Record<string, unknown> }).item;
      if (!item) continue;
      const name = cleanText(typeof item.name === "string" ? item.name : undefined);
      const url = cleanText(typeof item.url === "string" ? item.url : typeof item["@id"] === "string" ? item["@id"] : undefined);
      if (!name || !url) continue;
      const address = item.address as Record<string, unknown> | undefined;
      const streetAddress = cleanText(typeof address?.streetAddress === "string" ? address.streetAddress : undefined);
      const postcode = cleanText(typeof address?.postalCode === "string" ? address.postalCode : undefined) ?? extractPostcode(streetAddress);
      const rating = item.aggregateRating as Record<string, unknown> | undefined;
      const profileUrl = absoluteBooksyUrl(url, baseUrl);
      listings.push({
        businessName: name,
        profileUrl,
        address: streetAddress,
        postcode,
        cityTown: extractCityTown(streetAddress, null),
        ratingValue: typeof rating?.ratingValue === "number" ? rating.ratingValue : undefined,
        reviewCount: typeof rating?.reviewCount === "number" ? rating.reviewCount : undefined,
        category: extractCategoryFromUrl(profileUrl),
        sponsoredStatus: findSponsoredStatus(html, profileUrl),
      });
    }
  }
  return listings;
}

function toImportRow(listing: BooksyListing, input: BooksyExtractInput, summary: Record<string, unknown>): ExtractedLeadImportRow {
  const details = [
    "Extracted from visible Booksy public listing data.",
    listing.ratingValue !== undefined ? `Rating: ${listing.ratingValue}` : undefined,
    listing.reviewCount !== undefined ? `Reviews: ${listing.reviewCount}` : undefined,
    listing.category ? `Booksy category: ${listing.category}` : undefined,
    `Sponsored status: ${listing.sponsoredStatus}`,
  ].filter(Boolean);

  return {
    sourceUrl: listing.profileUrl,
    extractedBusinessName: listing.businessName,
    extractedAddress: listing.address,
    extractedPostcode: listing.postcode,
    extractedPhone: listing.phone,
    leadSource: "Booksy",
    currentProvider: "Booksy",
    estimatedCurrentMonthlyCost: 40,
    industrySlug: cleanText(input.defaultIndustrySlug),
    cityTown: listing.cityTown ?? cleanText(input.defaultCityTown),
    status: "PENDING_REVIEW",
    emailEnrichmentStatus: "Missing email",
    notes: details.join("\n"),
    raw: {
      ...summary,
      profileUrl: listing.profileUrl,
      ratingValue: listing.ratingValue,
      reviewCount: listing.reviewCount,
      category: listing.category,
      sponsoredStatus: listing.sponsoredStatus,
    },
  };
}

export async function extractVisibleBooksyListings(input: BooksyExtractInput): Promise<BooksyExtractResult> {
  const cleanUrl = buildRobotsRespectingUrl(input.sourceUrl);
  if (!cleanUrl) {
    return { rows: [], extractedCount: 0, sponsoredSkippedCount: 0, fallbackReason: "Invalid or non-Booksy URL." };
  }

  let html: string;
  try {
    const response = await fetch(cleanUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "MyExperiment.club lead research contact: hello@myexperiment.club",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok) {
      return {
        rows: [],
        extractedCount: 0,
        sponsoredSkippedCount: 0,
        fetchedUrl: cleanUrl.toString(),
        fallbackReason: `Booksy fetch returned HTTP ${response.status}.`,
      };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return {
        rows: [],
        extractedCount: 0,
        sponsoredSkippedCount: 0,
        fetchedUrl: cleanUrl.toString(),
        fallbackReason: "Booksy did not return public HTML.",
      };
    }
    html = await response.text();
  } catch {
    return {
      rows: [],
      extractedCount: 0,
      sponsoredSkippedCount: 0,
      fetchedUrl: cleanUrl.toString(),
      fallbackReason: "Booksy public HTML fetch failed.",
    };
  }

  const listings = parseJsonLdListings(html, cleanUrl);
  if (listings.length === 0) {
    return {
      rows: [],
      extractedCount: 0,
      sponsoredSkippedCount: 0,
      fetchedUrl: cleanUrl.toString(),
      fallbackReason: "Booksy did not expose listing data in the fetched HTML. Manual review or a browser-based extractor would be needed.",
    };
  }

  const visibleListings = listings.filter((listing) => listing.sponsoredStatus !== "Sponsored");
  const sponsoredSkippedCount = listings.length - visibleListings.length;
  const summary = {
    strategy: "booksy-public-html-json-ld",
    requestedUrl: input.sourceUrl,
    fetchedUrl: cleanUrl.toString(),
    extractedCount: visibleListings.length,
    sponsoredSkippedCount,
  };

  return {
    rows: visibleListings.map((listing) => toImportRow(listing, input, summary)),
    extractedCount: visibleListings.length,
    sponsoredSkippedCount,
    fetchedUrl: cleanUrl.toString(),
  };
}
