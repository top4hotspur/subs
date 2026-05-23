"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type DemoSiteNavProps = {
  templateSlug: WebsiteTemplateSlug;
  showAbout?: boolean;
  showContact?: boolean;
  showPolicy?: boolean;
};

const demoNavPillClass =
  "inline-flex items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2";

const activeDemoNavPillClass =
  "!border-slate-950 !bg-slate-950 !text-white visited:!text-white hover:!bg-slate-900 hover:!text-white";

const inactiveDemoNavPillClass =
  "!border-slate-300 !bg-white !text-slate-950 visited:!text-slate-950 hover:!border-slate-400 hover:!bg-slate-100 hover:!text-slate-950";

function demoNavButtonClass(active: boolean): string {
  return `${demoNavPillClass} ${active ? activeDemoNavPillClass : inactiveDemoNavPillClass}`;
}

export function DemoSiteNav({
  templateSlug,
  showAbout = true,
  showContact = true,
  showPolicy = true,
}: DemoSiteNavProps) {
  const pathname = usePathname();
  const allLinks = [
    { href: `/demo/${templateSlug}`, label: "Home" },
    { href: `/demo/${templateSlug}/booking`, label: "Bookings" },
    { href: `/demo/${templateSlug}/account`, label: "Customer View" },
    { href: `/demo/${templateSlug}/staff`, label: "Staff View" },
    { href: `/demo/${templateSlug}/admin`, label: "Admin View" },
    ...(showAbout ? [{ href: `/demo/${templateSlug}/about`, label: "About us" }] : []),
    ...(showContact ? [{ href: `/demo/${templateSlug}/contact`, label: "Contact" }] : []),
    ...(showPolicy ? [{ href: `/demo/${templateSlug}/policy`, label: "Policy" }] : []),
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {allLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={demoNavButtonClass(isActive)}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
