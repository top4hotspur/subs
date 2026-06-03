import { notFound } from "next/navigation";
import { DemoBookingPage } from "@/components/demo/demo-booking-page";
import { createDemoDraft, getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryBookingPageProps = {
  params: Promise<{ industry: string }>;
  searchParams: Promise<{ service?: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryBookingPage({
  params,
  searchParams,
}: DemoIndustryBookingPageProps) {
  const { industry } = await params;
  const { service } = await searchParams;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  const draft = createDemoDraft(industry);
  if (!template || !draft) {
    notFound();
  }

  return <DemoBookingPage template={template} defaultDraft={draft} initialServiceId={service} />;
}
