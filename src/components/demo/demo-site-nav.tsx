"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type DemoSiteNavProps = {
  templateSlug: WebsiteTemplateSlug;
};

const demoNavPillClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

const activeDemoNavPillClass =
  "border-sky-300 bg-sky-100 text-slate-950 shadow";

export function DemoSiteNav({ templateSlug }: DemoSiteNavProps) {
  const pathname = usePathname();
  const links = [
    { href: `/demo/${templateSlug}`, label: "Home" },
    { href: `/demo/${templateSlug}/booking`, label: "Bookings" },
    { href: `/demo/${templateSlug}/account`, label: "Customer login" },
    { href: `/demo/${templateSlug}/staff`, label: "Staff login" },
    { href: `/demo/${templateSlug}/admin`, label: "Business admin login" },
    { href: `/demo/${templateSlug}/about`, label: "About us" },
    { href: `/demo/${templateSlug}/contact`, label: "Contact" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${demoNavPillClass} ${isActive ? activeDemoNavPillClass : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
