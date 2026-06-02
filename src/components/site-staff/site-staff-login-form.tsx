"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

function inferSiteSlug(callbackUrl: string | null): string {
  if (!callbackUrl) return "";
  try {
    const normalized = callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
    const path = normalized.split("?")[0] ?? "";
    const match = path.match(/^\/site-staff\/([^/]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

function toFriendlyError(error: string | undefined): string {
  if (error === "INVALID_STAFF_ACCESS") {
    return "Login failed. Check your site slug, email and staff access code.";
  }
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED") {
    return "Staff login is not configured for this environment yet.";
  }
  if (error === "VALIDATION_ERROR") {
    return "Please check the site slug, email and access code.";
  }
  return "Staff login failed. Please try again or ask the business owner to reset your code.";
}

export function SiteStaffLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "";
  const initialSiteSlug = useMemo(
    () => search.get("siteSlug")?.trim() || inferSiteSlug(callbackUrl),
    [callbackUrl, search],
  );
  const [siteSlug, setSiteSlug] = useState(initialSiteSlug);
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/site-staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteSlug: siteSlug.trim(),
          email: email.trim().toLowerCase(),
          accessCode: accessCode.trim(),
          callbackUrl: callbackUrl || `/site-staff/${encodeURIComponent(siteSlug.trim())}`,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectUrl?: string }
        | null;
      if (!response.ok || !body?.ok) {
        setError(toFriendlyError(body?.error));
        setLoading(false);
        return;
      }
      router.push(body.redirectUrl || `/site-staff/${encodeURIComponent(siteSlug.trim())}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Staff appointment view login</h1>
      <p className="mt-2 text-sm text-slate-600">
        This area is for staff members who need to see the shared appointment diary for the business.
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Ask the business owner/admin to generate your staff access code if you do not have one yet.
      </p>
      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-800">
          Site slug
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={siteSlug}
            onChange={(event) => setSiteSlug(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Staff email
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Staff access code
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button type="submit" className={primaryButtonClass} disabled={loading}>
          {loading ? "Signing in..." : "Open staff diary"}
        </button>
      </form>
    </section>
  );
}
