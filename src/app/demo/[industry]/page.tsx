import { DemoPageClient } from "@/components/demo/demo-page-client";
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
      <section className="rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-white shadow-sm sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{template.category} demo</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{template.category} website preview</h1>
        <p className="mt-2 text-sm text-slate-200">
          Quick demo controls are below. The full website preview starts immediately after.
        </p>
      </section>
      <DemoPageClient template={template} defaultDraft={draft} />
    </main>
  );
}

