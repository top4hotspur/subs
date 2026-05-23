import { DemoPageClient } from "@/components/demo/demo-page-client";
import { DemoSiteIntroBanner } from "@/components/demo/demo-site-intro-banner";
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
      <DemoSiteIntroBanner template={template} />
      <DemoPageClient template={template} defaultDraft={draft} />
    </main>
  );
}
