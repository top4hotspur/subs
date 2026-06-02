"use client";

import { useMemo, useState } from "react";
import type { CustomerSiteGiftVoucherRecord, CustomerSiteGiftVoucherSettings, VoucherDeliveryMethod } from "@/lib/sites/customer-site-voucher-types";
import { formatVoucherMoney } from "@/lib/sites/customer-site-voucher-types";
import { primaryButtonClass, outlineButtonClass } from "@/lib/ui/button-styles";

type PublicGiftVoucherFormProps = {
  siteSlug: string;
  siteName: string;
  settings: CustomerSiteGiftVoucherSettings;
};

type SuccessState = {
  voucher: CustomerSiteGiftVoucherRecord;
  emailStatus?: unknown;
};

function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

export function PublicGiftVoucherForm({ siteSlug, siteName, settings }: PublicGiftVoucherFormProps) {
  const [amountMode, setAmountMode] = useState<string>(String(settings.presetValuesGbp[0] ?? 25));
  const [customAmount, setCustomAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<VoucherDeliveryMethod>(settings.deliveryMethods[0] ?? "DIGITAL_EMAIL");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [purchaserPhone, setPurchaserPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientPostcode, setRecipientPostcode] = useState("");
  const [message, setMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [loading, setLoading] = useState(false);

  const amountGbp = useMemo(() => {
    if (amountMode === "custom") return Number(customAmount);
    return Number(amountMode);
  }, [amountMode, customAmount]);
  const postagePence = deliveryMethod === "POST" ? toPence(settings.postageChargeGbp) : 0;
  const totalPence = Number.isFinite(amountGbp) ? toPence(amountGbp) + postagePence : postagePence;

  async function submit() {
    setStatusMessage(null);
    setSuccess(null);
    if (!Number.isFinite(amountGbp) || amountGbp <= 0) {
      setStatusMessage("Choose a voucher amount.");
      return;
    }
    if (!termsAccepted) {
      setStatusMessage("Please confirm you accept the gift voucher terms.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${encodeURIComponent(siteSlug)}/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountGbp,
          deliveryMethod,
          purchaserName,
          purchaserEmail,
          purchaserPhone,
          recipientName,
          recipientEmail,
          recipientAddress,
          recipientPostcode,
          message,
          termsAccepted,
        }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; voucher?: CustomerSiteGiftVoucherRecord; message?: string; error?: string; emailStatus?: unknown } | null;
      if (!response.ok || !body?.ok || !body.voucher) {
        setStatusMessage(body?.message || body?.error || "Could not submit this voucher request.");
        return;
      }
      setSuccess({ voucher: body.voucher, emailStatus: body.emailStatus });
      setStatusMessage("Gift voucher request received. The business will confirm payment before activating it.");
    } catch {
      setStatusMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <h2 className="text-lg font-semibold">Voucher request received</h2>
        <p className="mt-2 text-sm">
          Reference code: <span className="font-semibold">{success.voucher.voucherCode}</span>
        </p>
        <p className="mt-2 text-sm">
          Payment has not been taken online yet. {siteName} will confirm payment and activate the voucher before it can be redeemed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Voucher amount
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={amountMode} onChange={(event) => setAmountMode(event.target.value)}>
            {settings.presetValuesGbp.map((amount) => <option key={amount} value={amount}>£{amount}</option>)}
            {settings.allowCustomAmount ? <option value="custom">Custom amount</option> : null}
          </select>
        </label>
        {amountMode === "custom" ? (
          <label className="text-sm font-semibold text-slate-700">
            Custom amount (£)
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder={`${settings.minCustomAmountGbp}-${settings.maxCustomAmountGbp}`} />
          </label>
        ) : null}
        <label className="text-sm font-semibold text-slate-700">
          Delivery
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as VoucherDeliveryMethod)}>
            {settings.deliveryMethods.map((method) => <option key={method} value={method}>{method.replaceAll("_", " ").toLowerCase()}</option>)}
          </select>
        </label>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Total due: {formatVoucherMoney(totalPence)}</p>
          {postagePence > 0 ? <p className="mt-1 text-xs">Includes {formatVoucherMoney(postagePence)} postage.</p> : null}
          <p className="mt-1 text-xs">Payment is arranged directly with the business in this first version.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Your name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={purchaserName} onChange={(event) => setPurchaserName(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Your email
          <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={purchaserEmail} onChange={(event) => setPurchaserEmail(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Your phone
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={purchaserPhone} onChange={(event) => setPurchaserPhone(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Recipient name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Recipient email
          <input type="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} />
        </label>
        {deliveryMethod === "POST" ? (
          <>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Recipient address
              <textarea className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Recipient postcode
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={recipientPostcode} onChange={(event) => setRecipientPostcode(event.target.value)} />
            </label>
          </>
        ) : null}
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Message
          <textarea className="mt-1 min-h-[90px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1" />
        <span>I accept the gift voucher terms. {settings.termsText}</span>
      </label>
      {statusMessage ? <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{statusMessage}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={primaryButtonClass} onClick={() => void submit()} disabled={loading}>{loading ? "Submitting..." : "Request gift voucher"}</button>
        <a href={`/sites/${encodeURIComponent(siteSlug)}`} className={outlineButtonClass}>Back to site</a>
      </div>
    </div>
  );
}
