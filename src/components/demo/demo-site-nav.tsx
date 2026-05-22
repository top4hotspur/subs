import Link from "next/link";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { secondaryButtonClass } from "@/lib/ui/button-styles";

type DemoSiteNavProps = {
  templateSlug: WebsiteTemplateSlug;
};

export function DemoSiteNav({ templateSlug }: DemoSiteNavProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/demo/${templateSlug}`} className={secondaryButtonClass}>
        Home
      </Link>
      <Link href={`/demo/${templateSlug}/booking`} className={secondaryButtonClass}>
        Bookings
      </Link>
      <Link href={`/demo/${templateSlug}/account`} className={secondaryButtonClass}>
        Customer account
      </Link>
      <Link href={`/demo/${templateSlug}/staff`} className={secondaryButtonClass}>
        Staff login
      </Link>
      <Link href={`/demo/${templateSlug}/admin`} className={secondaryButtonClass}>
        Business admin login
      </Link>
      <Link href={`/demo/${templateSlug}/about`} className={secondaryButtonClass}>
        About us
      </Link>
      <Link href={`/demo/${templateSlug}/contact`} className={secondaryButtonClass}>
        Contact
      </Link>
    </div>
  );
}

