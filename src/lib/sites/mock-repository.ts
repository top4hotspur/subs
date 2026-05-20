import { websiteTemplates } from "@/lib/templates/templates";
import { WebsiteTemplatesRepository } from "@/lib/sites/repository";
import {
  DemoCustomisationDraft,
  DemoSiteConfig,
  WebsiteTemplate,
  WebsiteTemplateSlug,
} from "@/lib/sites/types";

function cloneConfig(config: DemoSiteConfig): DemoSiteConfig {
  return {
    ...config,
    openingHours: { ...config.openingHours },
    contact: { ...config.contact },
    services: config.services.map((service) => ({ ...service })),
  };
}

export const mockWebsiteTemplatesRepository: WebsiteTemplatesRepository = {
  listWebsiteTemplates() {
    return Object.values(websiteTemplates);
  },

  getWebsiteTemplate(slug) {
    return websiteTemplates[slug] ?? null;
  },

  getDefaultDemoConfig(slug) {
    const template = websiteTemplates[slug];
    return template ? cloneConfig(template.defaultConfig) : null;
  },

  createDemoDraft(slug) {
    const config = this.getDefaultDemoConfig(slug);
    if (!config) {
      return null;
    }

    return { slug, config };
  },

  updateDemoDraft(draft, patch) {
    return {
      ...draft,
      config: {
        ...draft.config,
        ...patch,
        contact: {
          ...draft.config.contact,
          ...(patch.contact ?? {}),
        },
        openingHours: {
          ...draft.config.openingHours,
          ...(patch.openingHours ?? {}),
        },
        services: patch.services ?? draft.config.services,
      },
    };
  },
};

export function listWebsiteTemplates(): WebsiteTemplate[] {
  return mockWebsiteTemplatesRepository.listWebsiteTemplates();
}

export function getWebsiteTemplate(slug: WebsiteTemplateSlug): WebsiteTemplate | null {
  return mockWebsiteTemplatesRepository.getWebsiteTemplate(slug);
}

export function getDefaultDemoConfig(slug: WebsiteTemplateSlug): DemoSiteConfig | null {
  return mockWebsiteTemplatesRepository.getDefaultDemoConfig(slug);
}

export function createDemoDraft(slug: WebsiteTemplateSlug): DemoCustomisationDraft | null {
  return mockWebsiteTemplatesRepository.createDemoDraft(slug);
}

export function updateDemoDraft(
  draft: DemoCustomisationDraft,
  patch: Partial<DemoSiteConfig>,
): DemoCustomisationDraft {
  return mockWebsiteTemplatesRepository.updateDemoDraft(draft, patch);
}
