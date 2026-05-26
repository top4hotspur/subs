"use client";

import { FormEvent, useMemo, useState } from "react";
import { WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type SubmitState = "idle" | "submitting" | "success" | "error";

type ContactFormState = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  industrySlug: string;
  message: string;
};

const INITIAL_STATE: ContactFormState = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  industrySlug: "",
  message: "",
};

function toIndustryLabel(slug: string): string {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function PublicContactForm() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorText, setErrorText] = useState<string>("");

  const industryOptions = useMemo(
    () => WEBSITE_TEMPLATE_SLUGS.map((slug) => ({ slug, label: toIndustryLabel(slug) })),
    [],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorText("");

    try {
      const response = await fetch("/api/contact-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          businessName: form.businessName || undefined,
          email: form.email,
          phone: form.phone || undefined,
          industrySlug: form.industrySlug || undefined,
          message: form.message,
          source: "contact-page",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; details?: Array<{ message?: string }> }
        | null;

      if (!response.ok || !payload?.ok) {
        const detail = payload?.details?.[0]?.message;
        if (response.status === 503 || payload?.error === "BACKEND_PERSISTENCE_NOT_CONFIGURED") {
          setErrorText("We could not submit your enquiry right now. Please try again shortly.");
        } else {
          setErrorText(detail || "Please try again or contact us directly.");
        }
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      setForm(INITIAL_STATE);
    } catch {
      setErrorText("We could not submit your enquiry right now. Please try again shortly.");
      setSubmitState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Business name
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.businessName}
            onChange={(event) =>
              setForm((current) => ({ ...current, businessName: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Industry interest
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={form.industrySlug}
          onChange={(event) =>
            setForm((current) => ({ ...current, industrySlug: event.target.value }))
          }
        >
          <option value="">Select an industry (optional)</option>
          {industryOptions.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Message
        <textarea
          required
          className="mt-1 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2"
          maxLength={2000}
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </label>

      {submitState === "success" ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Thanks - we&apos;ve received your enquiry and will get back to you.
        </p>
      ) : null}
      {submitState === "error" ? (
        <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorText || "Please try again or contact us directly."}
        </p>
      ) : null}

      <button type="submit" className={primaryButtonClass} disabled={submitState === "submitting"}>
        {submitState === "submitting" ? "Submitting..." : "Send enquiry"}
      </button>
    </form>
  );
}

