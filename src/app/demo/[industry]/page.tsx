import { DemoPageClient } from "@/components/demo/demo-page-client";
import { SiteHero } from "@/components/site-ui/site-hero";
import { createDemoDraft, getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { notFound } from "next/navigation";

type DemoIndustryPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryPage({ params }: DemoIndustryPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  const draft = createDemoDraft(industry);

  if (!template || !draft) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <SiteHero
        eyebrow={`${template.category} demo`}
        title={`${template.category} Website Preview`}
        subtitle="Explore the default template or continue with your active customised draft."
        helperText="This preview is designed for customer-facing local business websites with a neutral polished style."
      />
      <DemoPageClient template={template} defaultDraft={draft} />
    </main>
  );
}

