import { redirect } from "next/navigation";

type SiteAdminSlugLoginPageProps = {
  params: Promise<{ siteSlug: string }>;
  searchParams?: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function SiteAdminSlugLoginPage({
  params,
  searchParams,
}: SiteAdminSlugLoginPageProps) {
  const { siteSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const callbackUrlValue = Array.isArray(resolvedSearchParams.callbackUrl)
    ? resolvedSearchParams.callbackUrl[0]
    : resolvedSearchParams.callbackUrl;
  const callbackUrl = callbackUrlValue || `/site-admin/${siteSlug}`;
  const query = new URLSearchParams({
    siteSlug,
    callbackUrl,
  });

  redirect(`/site-admin/login?${query.toString()}`);
}
