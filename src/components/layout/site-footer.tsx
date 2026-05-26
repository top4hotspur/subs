"use client";

import { usePathname } from "next/navigation";
import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/demo/")) {
    return null;
  }

  return (
    <footer className="mt-16 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SiteFooterBlock
          brand="MyExperiment.club"
          description="Subscription websites for local service businesses with demo-first onboarding, managed setup, and ongoing monthly support."
          groups={[
            {
              title: "Explore",
              links: [
                { label: "Business types", href: "/#industries" },
                { label: "How it works", href: "/#how-it-works" },
              ],
            },
            {
              title: "Get started",
              links: [
                { label: "View demo site", href: "/demo/barbers" },
                { label: "Get your site now", href: "/setup/barbers" },
              ],
            },
            {
              title: "Platform",
              links: [
                { label: "Platform admin", href: "/admin" },
                { label: "Homepage", href: "/" },
              ],
            },
          ]}
        />
        <p className="mt-4 text-center text-xs text-slate-500">(c) {new Date().getFullYear()} MyExperiment.club.</p>
      </div>
    </footer>
  );
}