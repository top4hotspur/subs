"use client";

import { FormEvent, useMemo, useState } from "react";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import type { WebsiteTemplate } from "@/lib/sites/types";
import { formatSiteCurrency } from "@/lib/ui/display-labels";
import {
  createLocalVoucher,
  getLocalVoucherSettings,
} from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

type DemoVoucherPageProps = {
  template: WebsiteTemplate;
};

const PRESET_VALUES = [25, 50, 75, 100];

function deliveryLabel(method: VoucherDeliveryMethod): string {
  switch (method) {
    case VoucherDeliveryMethod.DIGITAL_EMAIL:
      return "Email";
    case VoucherDeliveryMethod.COLLECT_IN_STORE:
      return "Collect in store";
    case VoucherDeliveryMethod.POST:
      return "Post";
    default:
      return method;
  }
}

export function DemoVoucherPage({ template }: DemoVoucherPageProps) {
  const settings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );
  const voucherSettings = useMemo(
    () => getLocalVoucherSettings(template.slug),
    [template.slug],
  );
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const availableMethods = voucherSettings.deliveryMethods;
  const firstMethod = availableMethods[0] ?? VoucherDeliveryMethod.DIGITAL_EMAIL;

  const [selectedValue, setSelectedValue] = useState<number>(PRESET_VALUES[0]);
  const [customValue, setCustomValue] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<VoucherDeliveryMethod>(firstMethod);
  const [form, setForm] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    deliveryAddress: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    voucherCode: string;
    value: number;
    deliveryMethod: VoucherDeliveryMethod;
  } | null>(null);

  function getVoucherValue(): number | null {
    if (voucherSettings.allowCustomValue && customValue.trim().length > 0) {
      const parsed = Number(customValue);
      if (!Number.isFinite(parsed)) return null;
      if (parsed < voucherSettings.minValueGbp || parsed > voucherSettings.maxValueGbp) {
        return null;
      }
      return Math.round(parsed);
    }
    return selectedValue;
  }

  function submitVoucher(event: FormEvent) {
    event.preventDefault();
    const voucherValue = getVoucherValue();
    if (!voucherValue) {
      setMessage(
        `Enter a voucher value between ${voucherSettings.minValueGbp} and ${voucherSettings.maxValueGbp}.`,
      );
      return;
    }
    if (!form.purchaserName.trim() || !form.purchaserEmail.trim()) {
      setMessage("Enter purchaser name and email.");
      return;
    }
    if (deliveryMethod === VoucherDeliveryMethod.DIGITAL_EMAIL) {
      if (!form.recipientName.trim() || !form.recipientEmail.trim()) {
        setMessage("Enter recipient name and recipient email for email delivery.");
        return;
      }
    }
    if (deliveryMethod === VoucherDeliveryMethod.POST && !form.deliveryAddress.trim()) {
      setMessage("Enter a delivery address for posted vouchers.");
      return;
    }

    const created = createLocalVoucher(template.slug, {
      valueGbp: voucherValue,
      purchaserName: form.purchaserName.trim(),
      purchaserEmail: form.purchaserEmail.trim(),
      recipientName:
        deliveryMethod === VoucherDeliveryMethod.COLLECT_IN_STORE
          ? form.purchaserName.trim()
          : form.recipientName.trim() || form.purchaserName.trim(),
      recipientEmail:
        deliveryMethod === VoucherDeliveryMethod.DIGITAL_EMAIL
          ? form.recipientEmail.trim()
          : undefined,
      deliveryMethod,
      deliveryAddress:
        deliveryMethod === VoucherDeliveryMethod.POST
          ? form.deliveryAddress.trim()
          : undefined,
    });

    setConfirmation({
      voucherCode: created.voucherCode,
      value: created.valueGbp,
      deliveryMethod,
    });
    setMessage("Voucher request saved for this demo.");
  }

  return (
    <DemoSitePageShell template={template} settings={settings}>
      <SiteCard
        title="Buy a gift voucher"
        subtitle="Choose a value and delivery option for someone special."
      >
        {!voucherSettings.enabled ? (
          <p className="text-sm text-slate-600">
            Gift vouchers are currently disabled for this demo business.
          </p>
        ) : (
          <form className="grid gap-3" onSubmit={submitVoucher}>
            <div className="grid gap-2 sm:grid-cols-4">
              {PRESET_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    selectedValue === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedValue(value)}
                >
                  {formatSiteCurrency(value, currency)}
                </button>
              ))}
            </div>

            {voucherSettings.allowCustomValue ? (
              <label className="text-xs font-semibold text-slate-700">
                Custom voucher value ({voucherSettings.minValueGbp} - {voucherSettings.maxValueGbp})
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Enter custom amount"
                  value={customValue}
                  onChange={(event) => setCustomValue(event.target.value)}
                />
              </label>
            ) : null}

            <label className="text-xs font-semibold text-slate-700">
              Delivery option
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value as VoucherDeliveryMethod)}
              >
                {availableMethods.map((method) => (
                  <option key={method} value={method}>
                    {deliveryLabel(method)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                placeholder="Purchaser name"
                value={form.purchaserName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, purchaserName: event.target.value }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                placeholder="Purchaser email"
                value={form.purchaserEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, purchaserEmail: event.target.value }))
                }
              />
            </div>

            {deliveryMethod === VoucherDeliveryMethod.DIGITAL_EMAIL ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Recipient name"
                  value={form.recipientName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, recipientName: event.target.value }))
                  }
                />
                <input
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Recipient email"
                  value={form.recipientEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, recipientEmail: event.target.value }))
                  }
                />
                <textarea
                  className="sm:col-span-2 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  rows={2}
                  placeholder="Optional message"
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                />
              </div>
            ) : null}

            {deliveryMethod === VoucherDeliveryMethod.COLLECT_IN_STORE ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                Voucher collection will be arranged in store.
              </p>
            ) : null}

            {deliveryMethod === VoucherDeliveryMethod.POST ? (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  rows={2}
                  placeholder="Delivery address (where the voucher should be posted)"
                  value={form.deliveryAddress}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, deliveryAddress: event.target.value }))
                  }
                />
                <p className="text-xs text-slate-600">
                  Postage charge: {formatSiteCurrency(voucherSettings.postageChargeGbp, currency)}
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue voucher checkout
            </button>

            {message ? <p className="text-xs text-slate-600">{message}</p> : null}
            {confirmation ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Voucher request saved</p>
                <p>Voucher reference: {confirmation.voucherCode}</p>
                <p>Value: {formatSiteCurrency(confirmation.value, currency)}</p>
                <p>Delivery method: {deliveryLabel(confirmation.deliveryMethod)}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Payment is not processed in this demo. Payment would be taken at checkout.
                </p>
              </div>
            ) : null}
          </form>
        )}
      </SiteCard>
    </DemoSitePageShell>
  );
}
