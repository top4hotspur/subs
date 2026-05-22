"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

function toFriendlyLoginError(error: string | null | undefined): string {
  if (!error) {
    return "Login failed. Check your admin email and access code.";
  }
  if (error === "CredentialsSignin") {
    return "Login failed. Check your admin email and access code.";
  }
  if (error === "Configuration") {
    return "Login failed due to auth configuration. Please contact platform admin.";
  }
  if (error === "AccessDenied") {
    return "Access denied for this account.";
  }
  return `Login failed: ${error}`;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [callbackUrl] = useState(() => {
    if (typeof window === "undefined") return "/admin";
    return new URLSearchParams(window.location.search).get("callbackUrl") || "/admin";
  });

  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim(),
      accessCode: accessCode.trim(),
      redirect: false,
      callbackUrl,
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

    router.push(result.url || callbackUrl || "/admin");
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Platform admin login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Platform-admin only. Public setup pages remain accessible without login.
        </p>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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
            Access code
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className={primaryButtonClass} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
