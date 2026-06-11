"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { primaryButtonClass } from "@/lib/ui/button-styles";

function toFriendlyLoginError(error: string | null | undefined): string {
  if (!error) {
    return "Login failed. Check your admin email and password.";
  }
  if (error === "CredentialsSignin") {
    return "Login failed. Check your admin email and password.";
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
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("platform-admin-credentials", {
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

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotLoading(true);
    setHelpMessage(null);
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setHelpMessage(body?.message || "If this email is authorised, we'll send admin access instructions.");
    } catch {
      setHelpMessage("If this email is authorised, we'll send admin access instructions.");
    } finally {
      setForgotLoading(false);
    }
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
            Password
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
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            type="button"
            className="text-sm font-semibold text-teal-700 underline-offset-2 hover:underline"
            onClick={() => {
              setShowForgotPassword((current) => !current);
              setForgotEmail(email);
              setHelpMessage(null);
            }}
          >
            Forgot password?
          </button>
          {showForgotPassword ? (
            <form className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3" onSubmit={handleForgotSubmit}>
              <p className="text-xs text-slate-600">
                Enter your platform admin email. If this email is authorised, we&apos;ll send admin access instructions.
              </p>
              <label className="block text-sm font-medium text-slate-800">
                Admin email
                <input
                  type="email"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className={primaryButtonClass} disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send access instructions"}
              </button>
              {helpMessage ? <p className="text-sm text-slate-700">{helpMessage}</p> : null}
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
