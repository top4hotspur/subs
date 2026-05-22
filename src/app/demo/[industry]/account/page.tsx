import { notFound } from "next/navigation";
import { DemoAccountPage } from "@/components/demo/demo-account-page";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryAccountPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryAccountPage({ params }: DemoIndustryAccountPageProps) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();
  return <DemoAccountPage template={template} />;
}

