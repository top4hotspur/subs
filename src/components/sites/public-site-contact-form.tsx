"use client";

import { useEffect, useState } from "react";
import { primaryButtonClass } from "@/lib/ui/button-styles";

type PublicSiteContactFormProps = {
  siteSlug: string;
  initialPurpose?: string;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  bookingId?: string;
};

const PURPOSE_OPTIONS = [
  "Change my booking",
  "Cancel my booking",
  "Payment question",
  "General enquiry",
  "Complaint / problem",
  "Other",
];

type CustomerSessionResponse = {
  ok?: boolean;
  customer?: {
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
};

export function PublicSiteContactForm({
  siteSlug,
  initialPurpose = "General enquiry",
  initialName = "",
  initialEmail = "",
  initialPhone = "",
  bookingId,
}: PublicSiteContactFormProps) {
  const [purpose, setPurpose] = useState(initialPurpose);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomerSession() {
      if (initialName || initialEmail || initialPhone) return;
      const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/account/session`, {
        cache: "no-store",
      }).catch(() => null);
      if (!response?.ok) return;
      const body = (await response.json().catch(() => null)) as CustomerSessionResponse | null;
      const customer = body?.customer;
      if (cancelled || !customer) return;
      setName([customer.firstName, customer.lastName].filter(Boolean).join(" "));
      setEmail(customer.email);
      setPhone(customer.phone ?? "");
    }
    void loadCustomerSession();
    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialName, initialPhone, siteSlug]);

  async function submit() {
    setSubmitting(true);
    setStatusMessage("Sending your message...");
    const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim(),
        bookingId: bookingId || null,
      }),
    }).catch(() => null);
    setSubmitting(false);
    if (!response?.ok) {
      setStatusMessage("Could not send your message right now. Please try again or contact the business directly.");
      return;
    }
    setStatusMessage("Your message has been sent to the business.");
    setMessage("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Contact business</h2>
      <p className="mt-1 text-sm text-slate-600">
        Send a structured message to the business. They will reply using the contact details you provide.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
          Purpose
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
            {PURPOSE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Email
          <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Phone
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
          Message
          <textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} required />
        </label>
      </div>
      {bookingId ? (
        <p className="mt-2 text-xs text-slate-600">Booking reference will be included with this message.</p>
      ) : null}
      <button type="button" className={`mt-4 ${primaryButtonClass}`} onClick={() => void submit()} disabled={submitting || !name.trim() || !email.trim() || !message.trim()}>
        {submitting ? "Sending..." : "Send message"}
      </button>
      {statusMessage ? <p className="mt-3 text-sm font-semibold text-slate-700">{statusMessage}</p> : null}
    </div>
  );
}
