type PriceLikeService = {
  requiresQuote?: boolean;
  basePriceGbp?: number;
  priceLabel?: string;
  rolePriceOverrides?: { priceGbp: number }[];
  staffPriceOverrides?: { priceGbp: number }[];
};

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

export function getPublicServicePriceLabel(service: PriceLikeService): string | undefined {
  if (service.requiresQuote) return "Quote required";

  const lowest = getLowestServicePriceGbp(service);
  if (lowest !== null) {
    if (serviceHasVariablePricing(service)) return `From £${lowest}`;
    return `£${lowest}`;
  }

  return service.priceLabel;
}
