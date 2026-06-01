export const PROVIDER_MONTHLY_COST_ESTIMATES_GBP: Record<string, number> = {
  booksy: 99,
  fresha: 79,
  treatwell: 89,
  wix: 35,
  squarespace: 30,
  godaddy: 25,
  shopify: 39,
};

export function getProviderMonthlyCostEstimate(provider?: string | null): number | null {
  if (!provider) return null;
  const key = provider.trim().toLowerCase();
  return PROVIDER_MONTHLY_COST_ESTIMATES_GBP[key] ?? null;
}
