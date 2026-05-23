import { notFound } from "next/navigation";
import { DemoPolicyPage } from "@/components/demo/demo-policy-page";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryPolicyPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryPolicyPage({
  params,
}: DemoIndustryPolicyPageProps) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();
  return <DemoPolicyPage template={template} />;
}
