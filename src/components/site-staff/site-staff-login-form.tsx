"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type SiteStaffLoginFormProps = {
  initialSiteSlug?: string;
  callbackUrl?: string;
};

function toFriendlyError(error: string | undefined): string {
  if (error === "INVALID_STAFF_ACCESS") {
    return "Login failed. Check your email and password.";
  }
  if (error === "BACKEND_PERSISTENCE_NOT_CONFIGURED") {
    return "Staff login is not configured for this environment yet.";
  }
  if (error === "VALIDATION_ERROR") {
    return "Please check your email and password.";
  }
  return "Staff login failed. Please try again or ask the business owner to reset your password.";
}

export function SiteStaffLoginForm({
  initialSiteSlug = "",
  callbackUrl = "",
}: SiteStaffLoginFormProps) {
  const router = useRouter();
  const [siteSlug, setSiteSlug] = useState(initialSiteSlug);
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const siteSlugKnown = Boolean(initialSiteSlug.trim());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedSiteSlug = siteSlug.trim();
      if (!trimmedSiteSlug) {
        setError("Enter your site slug, email and password.");
        setLoading(false);
        return;
      }
      const response = await fetch("/api/site-staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteSlug: trimmedSiteSlug,
          email: email.trim().toLowerCase(),
          accessCode: accessCode.trim(),
          callbackUrl: callbackUrl || `/site-staff/${encodeURIComponent(trimmedSiteSlug)}`,
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
      router.push(body.redirectUrl || `/site-staff/${encodeURIComponent(trimmedSiteSlug)}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
      {siteSlugKnown ? (
        <input type="hidden" name="siteSlug" value={siteSlug} />
      ) : (
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
      )}
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
        Password
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
  );
}
