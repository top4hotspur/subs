import {
  DemoCustomisationDraft,
  DemoSiteConfig,
  WebsiteTemplate,
  WebsiteTemplateSlug,
} from "@/lib/sites/types";

export interface WebsiteTemplatesRepository {
  listWebsiteTemplates: () => WebsiteTemplate[];
  getWebsiteTemplate: (slug: WebsiteTemplateSlug) => WebsiteTemplate | null;
  getDefaultDemoConfig: (slug: WebsiteTemplateSlug) => DemoSiteConfig | null;
  createDemoDraft: (slug: WebsiteTemplateSlug) => DemoCustomisationDraft | null;
  updateDemoDraft: (
    draft: DemoCustomisationDraft,
    patch: Partial<DemoSiteConfig>,
  ) => DemoCustomisationDraft;
}
