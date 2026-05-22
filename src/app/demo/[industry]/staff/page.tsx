import { notFound } from "next/navigation";
import { DemoStaffPage } from "@/components/demo/demo-staff-page";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryStaffPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryStaffPage({ params }: DemoIndustryStaffPageProps) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();
  return <DemoStaffPage template={template} />;
}

