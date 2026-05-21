"use client";

import { CustomerSiteSettings } from "@/lib/sites/site-settings-types";

import { primaryButtonClass } from "@/lib/ui/button-styles";

type Props = {
  settings: CustomerSiteSettings;
  onChange: (settings: CustomerSiteSettings) => void;
};

export function PaymentPolicyEditor({ settings, onChange }: Props) {
  const payment = settings.paymentSettings;
  const cancellation = settings.cancellationPolicy;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Payment and cancellation policy</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={payment.cardPaymentsEnabled} disabled readOnly />
          Card payments enabled (default)
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={payment.cashPaymentsEnabled}
            onChange={(e) =>
              onChange({
                ...settings,
                paymentSettings: { ...payment, cashPaymentsEnabled: e.target.checked },
              })
            }
          />
          Cash payments enabled
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={payment.requirePrepaymentForBookings}
            onChange={(e) =>
              onChange({
                ...settings,
                paymentSettings: { ...payment, requirePrepaymentForBookings: e.target.checked },
              })
            }
          />
          Require pre-payment for bookings
        </label>
      </div>

      {payment.cashPaymentsEnabled ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Cash bookings increase no-show risk because payment is not taken upfront.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Cancellation window (hours)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={cancellation.cancellationWindowHours}
            onChange={(e) =>
              onChange({
                ...settings,
                cancellationPolicy: {
                  ...cancellation,
                  cancellationWindowHours: Number(e.target.value || 24),
                },
              })
            }
          />
        </label>
      </div>

      <p className="text-sm text-slate-700">
        Bookings can be cancelled up to {cancellation.cancellationWindowHours} hours in advance for a full refund.
        No refund is available after this notice period.
      </p>

      <label className="block text-sm font-medium text-slate-700">
        Policy text
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={cancellation.policyText ?? ""}
          onChange={(e) =>
            onChange({
              ...settings,
              cancellationPolicy: { ...cancellation, policyText: e.target.value },
            })
          }
        />
      </label>

      <p className="text-xs text-slate-500">Local/mock only. No real payment gateway or refund processing is connected.</p>
      <button type="button" className={primaryButtonClass} onClick={() => onChange({ ...settings })}>Apply local policy changes</button>
    </section>
  );
}

