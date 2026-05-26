import Link from "next/link";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";
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

  if (!template) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Create your demo site</h1>
      <p className="mt-2 text-slate-600">
        Explore the demo, open the Admin View to adjust services, staff, prices, themes and booking settings, then use
        Get your site now when you are ready.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/demo/${template.slug}`} className={primaryButtonClass}>
          Open demo site
        </Link>
        <Link href={`/demo/${template.slug}/admin`} className={secondaryButtonClass}>
          Open Admin View
        </Link>
        <Link href={`/setup/${template.slug}`} className={secondaryButtonClass}>
          Get your site now
        </Link>
      </div>
    </main>
  );
}
