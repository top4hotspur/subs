import { DemoCustomizer } from "@/components/demo/demo-customizer";
import { createDemoDraft, getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { notFound } from "next/navigation";

type DemoCustomizeIndustryPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoCustomizeIndustryPage({ params }: DemoCustomizeIndustryPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  const initialDraft = createDemoDraft(industry);

  if (!template || !initialDraft) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Create my own site</h1>
      <p className="mt-2 text-slate-600">
        Start with key business details now, then continue to setup for domain, communications, and final onboarding.
      </p>
      <div className="mt-8">
        <DemoCustomizer template={template} initialDraft={initialDraft} />
      </div>
    </main>
  );
}
