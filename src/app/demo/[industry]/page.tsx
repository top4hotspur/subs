import { DemoPreview } from "@/components/demo/demo-preview";
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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">{template.category} Demo</h1>
      <p className="mb-6 text-slate-600">Preview the starter layout before customising your own version.</p>
      <DemoPreview template={template} draft={draft} />
    </main>
  );
}
