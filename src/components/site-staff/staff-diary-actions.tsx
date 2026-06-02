"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type StaffDiaryActionsProps = {
  siteSlug: string;
  bookingId: string;
};

type StaffVoucherSummary = {
  id: string;
  voucherCode: string;
  amount: string;
  remaining: string;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  recipientName: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
};

export function MarkBookingCompletedButton({ siteSlug, bookingId }: StaffDiaryActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function markCompleted() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/site-staff/${encodeURIComponent(siteSlug)}/bookings/${encodeURIComponent(bookingId)}/complete`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setMessage(body?.error === "BOOKING_UPDATE_NOT_ALLOWED"
          ? "This booking cannot be marked completed."
          : body?.error === "STAFF_PERMISSION_DENIED"
            ? "Your staff permissions do not allow this action."
          : "Could not update this booking.");
        setLoading(false);
        return;
      }
      setMessage("Marked completed.");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={`${outlineButtonClass} ${smallButtonClass}`}
        onClick={() => void markCompleted()}
        disabled={loading}
      >
        {loading ? "Updating..." : "Mark completed"}
      </button>
      {message ? <span className="text-xs text-slate-600">{message}</span> : null}
    </div>
  );
}

export function SiteStaffLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/site-staff/logout", { method: "POST" }).catch(() => null);
    router.push("/site-staff/login");
    setLoading(false);
  }

  return (
    <button
      type="button"
      className={`${outlineButtonClass} ${smallButtonClass}`}
      onClick={() => void logout()}
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}

export function StaffVoucherLookup({ siteSlug, canRedeem }: { siteSlug: string; canRedeem: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<StaffVoucherSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setMessage(null);
    setVoucher(null);
    try {
      const response = await fetch(
        `/api/site-staff/${encodeURIComponent(siteSlug)}/vouchers?code=${encodeURIComponent(code)}`,
      );
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; voucher?: StaffVoucherSummary; error?: string }
        | null;
      if (!response.ok || !body?.ok || !body.voucher) {
        setMessage(body?.error === "VOUCHER_NOT_FOUND" ? "No voucher found with that code." : "Could not look up this voucher.");
        return;
      }
      setVoucher(body.voucher);
      setMessage("Voucher found.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function redeem() {
    if (!voucher) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/site-staff/${encodeURIComponent(siteSlug)}/vouchers/${encodeURIComponent(voucher.id)}/redeem`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; voucher?: StaffVoucherSummary; error?: string }
        | null;
      if (!response.ok || !body?.ok || !body.voucher) {
        setMessage(
          body?.error === "STAFF_PERMISSION_DENIED"
            ? "Your staff permissions do not allow voucher redemption."
            : body?.error === "VOUCHER_NOT_ACTIVE"
              ? "Only active vouchers can be redeemed."
              : "Could not redeem this voucher.",
        );
        return;
      }
      setVoucher(body.voucher);
      setMessage("Voucher marked redeemed.");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Gift voucher lookup</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter a voucher code to check its status. Redemption is only available to staff with voucher permission.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          className="min-w-[220px] rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Voucher code"
        />
        <button type="button" className={`${outlineButtonClass} ${smallButtonClass}`} onClick={() => void lookup()} disabled={loading}>
          {loading ? "Checking..." : "Check voucher"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      {voucher ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{voucher.voucherCode}</p>
              <p className="mt-1 text-xs">Value: {voucher.amount} | Remaining: {voucher.remaining}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
              {voucher.status.replaceAll("_", " ")}
            </span>
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <p><span className="font-semibold">Payment:</span> {voucher.paymentStatus.replaceAll("_", " ")}</p>
            <p><span className="font-semibold">Recipient:</span> {voucher.recipientName || "Not set"}</p>
            <p><span className="font-semibold">Expires:</span> {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("en-GB") : "Not set"}</p>
            <p><span className="font-semibold">Redeemed:</span> {voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleString("en-GB") : "No"}</p>
          </div>
          {voucher.status === "ACTIVE" && canRedeem ? (
            <button type="button" className={`mt-3 ${outlineButtonClass} ${smallButtonClass}`} onClick={() => void redeem()} disabled={loading}>
              Mark voucher redeemed
            </button>
          ) : null}
          {!canRedeem ? <p className="mt-3 text-xs text-slate-600">Your staff permissions do not allow voucher redemption.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
