"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type SiteAdminLoginFormProps = {
  initialSiteSlug?: string;
  callbackUrl?: string;
};

function toFriendlyLoginError(error: string | null | undefined): string {
  if (!error || error === "CredentialsSignin") {
    return "Login failed. Check your site slug, email and password.";
  }
  if (error === "Configuration") {
    return "Login failed due to auth configuration. Please contact support.";
  }
  return `Login failed: ${error}`;
}

export function SiteAdminLoginForm({
  initialSiteSlug = "",
  callbackUrl = "",
}: SiteAdminLoginFormProps) {
  const router = useRouter();
  const [siteSlug, setSiteSlug] = useState(initialSiteSlug);
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedSiteSlug = siteSlug.trim();
    const result = await signIn("site-admin-credentials", {
      siteSlug: trimmedSiteSlug,
      email: email.trim().toLowerCase(),
      accessCode: accessCode.trim(),
      redirect: false,
      callbackUrl: callbackUrl || `/site-admin/${encodeURIComponent(trimmedSiteSlug)}`,
    });

    if (!result) {
      setError("Login failed. No response from auth service.");
      setLoading(false);
      return;
    }
    if (result.error || !result.ok) {
      setError(toFriendlyLoginError(result.error));
      setLoading(false);
      return;
    }

    router.push(result.url || callbackUrl || `/site-admin/${encodeURIComponent(trimmedSiteSlug)}`);
    setLoading(false);
  }

  return (
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
        Email
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
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
