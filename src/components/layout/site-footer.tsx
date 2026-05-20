import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:px-8">
        <p className="font-medium text-slate-800">Subs / MyExperiment.club</p>
        <p>
          Subscription websites for local service businesses. Built for easy setup,
          ongoing management, and predictable monthly growth.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/account" className="hover:text-slate-900">
            Customer login
          </Link>
          <Link href="/admin" className="hover:text-slate-900">
            Admin login
          </Link>
        </div>
        <p>© {new Date().getFullYear()} MyExperiment.club. All rights reserved.</p>
      </div>
    </footer>
  );
}
