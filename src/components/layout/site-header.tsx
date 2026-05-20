import Link from "next/link";
import { SiteBrandMark } from "@/components/site-ui/site-brand-mark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <SiteBrandMark name="MyExperiment.club" tagline="Subscription websites" />
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600 sm:gap-5">
          <Link href="/#industries" className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
            Industries
          </Link>
          <Link href="/#how-it-works" className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
            How it works
          </Link>
          <Link href="/account" className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
            Customer login
          </Link>
          <Link href="/admin" className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900">
            Admin login
          </Link>
        </nav>
      </div>
    </header>
  );
}

