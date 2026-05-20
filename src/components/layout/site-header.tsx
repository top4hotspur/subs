import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          MyExperiment.club
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/#industries" className="hover:text-slate-900">
            Industries
          </Link>
          <Link href="/#how-it-works" className="hover:text-slate-900">
            How it works
          </Link>
          <Link href="/account" className="hover:text-slate-900">
            Customer login
          </Link>
          <Link href="/admin" className="hover:text-slate-900">
            Admin login
          </Link>
        </nav>
      </div>
    </header>
  );
}
