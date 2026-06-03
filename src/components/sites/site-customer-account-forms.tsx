"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type AccountFormProps = {
  siteSlug: string;
  mode: "login" | "register";
};

function friendlyError(error: string | undefined, mode: "login" | "register"): string {
  if (error === "CUSTOMER_ACCOUNT_NOT_CREATED") return "We could not create this account with those details. Please check the form or log in if you already have an account.";
  if (error === "INVALID_CUSTOMER_ACCESS") return "Login failed. Check your email and access code.";
  if (error === "VALIDATION_ERROR") return "Please check the form fields and access code.";
  return mode === "login" ? "Could not log in right now." : "Could not create account right now.";
}

export function SiteCustomerAccountForm({ siteSlug, mode }: AccountFormProps) {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || `/sites/${encodeURIComponent(siteSlug)}/account`;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const endpoint = mode === "login" ? "login" : "register";
    const payload = mode === "login"
      ? { email: email.trim(), accessCode: accessCode.trim(), callbackUrl }
      : {
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          email: email.trim(),
          phone: phone.trim(),
          accessCode: accessCode.trim(),
          marketingOptIn,
        };
    const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/account/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (!response) {
      setLoading(false);
      setMessage("Network error. Please try again.");
      return;
    }
    const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; redirectUrl?: string } | null;
    if (!response.ok || !body?.ok) {
      setLoading(false);
      setMessage(friendlyError(body?.error, mode));
      return;
    }
    router.push(body.redirectUrl || `/sites/${encodeURIComponent(siteSlug)}/account`);
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      {mode === "register" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            First name
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </label>
          <label className="text-sm font-semibold text-slate-800">
            Last name
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </label>
        </div>
      ) : null}
      <label className="block text-sm font-semibold text-slate-800">
        Email
        <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {mode === "register" ? (
        <label className="block text-sm font-semibold text-slate-800">
          Phone
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </label>
      ) : null}
      <label className="block text-sm font-semibold text-slate-800">
        Access code
        <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} required minLength={6} />
      </label>
      <p className="text-xs text-slate-600">
        Use a private access code for this site account. It is separate from staff and business-admin access.
      </p>
      {mode === "register" ? (
        <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={marketingOptIn}
            onChange={(event) => setMarketingOptIn(event.target.checked)}
          />
          <span>I&apos;d like to receive offers, updates and reminders from this business.</span>
        </label>
      ) : null}
      {message ? <p className="text-sm text-rose-700">{message}</p> : null}
      <button type="submit" className={primaryButtonClass} disabled={loading}>
        {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}

export function SiteCustomerMarketingPreference({
  siteSlug,
  initialMarketingOptIn,
}: {
  siteSlug: string;
  initialMarketingOptIn: boolean;
}) {
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(nextValue: boolean) {
    setMarketingOptIn(nextValue);
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/account/session`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketingOptIn: nextValue }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) {
      setMarketingOptIn(!nextValue);
      setMessage("Could not update your marketing preference right now.");
      return;
    }
    setMessage(nextValue ? "You are opted in to offers and updates." : "You are opted out of offers and updates.");
  }

  return (
    <div className="mt-3">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={marketingOptIn}
          onChange={(event) => void save(event.target.checked)}
          disabled={saving}
        />
        <span>I&apos;d like to receive offers, updates and reminders from this business.</span>
      </label>
      <p className="mt-1 text-xs text-slate-600">
        Current preference: {marketingOptIn ? "Opted in" : "Opted out"}.
      </p>
      {message ? <p className="mt-1 text-xs font-semibold text-teal-800">{message}</p> : null}
    </div>
  );
}

export function SiteCustomerLogoutButton({ siteSlug }: { siteSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function logout() {
    setLoading(true);
    await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/account/logout`, { method: "POST" }).catch(() => null);
    router.push(`/sites/${encodeURIComponent(siteSlug)}/account/login`);
    router.refresh();
    setLoading(false);
  }
  return (
    <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100" onClick={() => void logout()} disabled={loading}>
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}
