import { industryOperationsBlueprints } from "@/lib/industry/operations-blueprints";
import { IndustryOperationsBlueprint } from "@/lib/industry/operations-types";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

export function listIndustryOperationsBlueprints(): IndustryOperationsBlueprint[] {
  return Object.values(industryOperationsBlueprints);
}

export function getIndustryOperationsBlueprint(
  slug: WebsiteTemplateSlug,
): IndustryOperationsBlueprint | null {
  return industryOperationsBlueprints[slug] ?? null;
}

export function getBlueprintForTemplate(
  slug: WebsiteTemplateSlug,
): IndustryOperationsBlueprint | null {
  return getIndustryOperationsBlueprint(slug);
}
