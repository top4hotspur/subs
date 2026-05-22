import { notFound } from "next/navigation";
import { DemoAboutContactPage } from "@/components/demo/demo-about-contact-pages";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryContactPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryContactPage({ params }: DemoIndustryContactPageProps) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();
  return <DemoAboutContactPage template={template} mode="contact" />;
}

