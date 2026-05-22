import { notFound } from "next/navigation";
import { DemoBusinessAdminPage } from "@/components/demo/demo-business-admin-page";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryAdminPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryAdminPage({ params }: DemoIndustryAdminPageProps) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();
  return <DemoBusinessAdminPage template={template} />;
}

