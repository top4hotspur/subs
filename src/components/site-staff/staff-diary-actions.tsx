"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

type StaffDiaryActionsProps = {
  siteSlug: string;
  bookingId: string;
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
