import Link from "next/link";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type DemoSiteNavProps = {
  templateSlug: WebsiteTemplateSlug;
};

const demoNavPillClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

export function DemoSiteNav({ templateSlug }: DemoSiteNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/demo/${templateSlug}`} className={demoNavPillClass}>
        Home
      </Link>
      <Link href={`/demo/${templateSlug}/booking`} className={demoNavPillClass}>
        Bookings
      </Link>
      <Link href={`/demo/${templateSlug}/account`} className={demoNavPillClass}>
        Customer account
      </Link>
      <Link href={`/demo/${templateSlug}/staff`} className={demoNavPillClass}>
        Staff login
      </Link>
      <Link href={`/demo/${templateSlug}/admin`} className={demoNavPillClass}>
        Business admin login
      </Link>
      <Link href={`/demo/${templateSlug}/about`} className={demoNavPillClass}>
        About us
      </Link>
      <Link href={`/demo/${templateSlug}/contact`} className={demoNavPillClass}>
        Contact
      </Link>
    </div>
  );
}

