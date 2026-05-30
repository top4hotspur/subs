import { notFound } from "next/navigation";
import { DemoVoucherPage } from "@/components/demo/demo-voucher-page";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type DemoIndustryVouchersPageProps = {
  params: Promise<{ industry: string }>;
};

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function DemoIndustryVouchersPage({
  params,
}: DemoIndustryVouchersPageProps) {
  const { industry } = await params;

  if (!isWebsiteTemplateSlug(industry)) {
    notFound();
  }

  const template = getWebsiteTemplate(industry);
  if (!template) {
    notFound();
  }

  return <DemoVoucherPage template={template} />;
}
