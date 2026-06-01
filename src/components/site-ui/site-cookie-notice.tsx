"use client";

import { useState } from "react";
import Link from "next/link";

export function SiteCookieNotice({ siteSlug }: { siteSlug: string }) {
  const key = `subs-site-cookie-accepted:${siteSlug}`;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const accepted = window.localStorage.getItem(key);
    return accepted !== "yes";
  });

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border border-slate-300 bg-white p-4 shadow-lg md:left-auto md:max-w-md">
      <p className="text-sm text-slate-700">
        This site uses essential cookies and may use optional analytics, booking, and payment cookies when enabled.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
          onClick={() => {
            window.localStorage.setItem(key, "yes");
            setVisible(false);
          }}
        >
          Accept
        </button>
        <Link
          href={`/sites/${encodeURIComponent(siteSlug)}/cookies`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Cookie Policy
        </Link>
      </div>
    </div>
  );
}
