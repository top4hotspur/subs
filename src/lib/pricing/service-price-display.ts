type PriceLikeService = {
  requiresQuote?: boolean;
  basePriceGbp?: number;
  priceLabel?: string;
  rolePriceOverrides?: { priceGbp: number }[];
  staffPriceOverrides?: { priceGbp: number }[];
};

function formatCurrency(amount: number, currency: "GBP" | "EUR" | "USD" = "GBP"): string {
  const locale = currency === "USD" ? "en-US" : currency === "EUR" ? "de-DE" : "en-GB";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function getServicePriceValues(service: PriceLikeService): number[] {
  const values: number[] = [];
  if (typeof service.basePriceGbp === "number") values.push(service.basePriceGbp);
  (service.rolePriceOverrides ?? []).forEach((item) => values.push(item.priceGbp));
  (service.staffPriceOverrides ?? []).forEach((item) => values.push(item.priceGbp));
  return values.filter((value) => Number.isFinite(value));
}

export function getLowestServicePriceGbp(service: PriceLikeService): number | null {
  const values = getServicePriceValues(service);
  if (values.length === 0) return null;
  return Math.min(...values);
}

export function serviceHasVariablePricing(service: PriceLikeService): boolean {
  const values = getServicePriceValues(service);
  if (values.length <= 1) return false;
  return new Set(values).size > 1;
}

export function getPublicServicePriceLabel(
  service: PriceLikeService,
  currency: "GBP" | "EUR" | "USD" = "GBP",
): string | undefined {
  if (service.requiresQuote) return "Quote required";

  const lowest = getLowestServicePriceGbp(service);
  if (lowest !== null) {
    if (serviceHasVariablePricing(service)) return `From ${formatCurrency(lowest, currency)}`;
    return formatCurrency(lowest, currency);
  }

  return service.priceLabel;
}
