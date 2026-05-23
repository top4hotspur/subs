"use client";

import { useMemo, useState } from "react";
import { DemoAccessDetailsCard } from "@/components/demo/demo-access-details-card";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
import {
  getLocalCustomerProfile,
  saveLocalCustomerProfile,
} from "@/lib/demo/local-customer-profile";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";
import { CustomerRequestStatus } from "@/lib/requests/request-types";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import { formatSiteCurrency, formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";
import {
  createLocalVoucher,
  listLocalVouchers,
} from "@/lib/vouchers/local-vouchers";
import { VoucherDeliveryMethod } from "@/lib/vouchers/voucher-types";

type DemoAccountPageProps = {
  template: WebsiteTemplate;
};

export function DemoAccountPage({ template }: DemoAccountPageProps) {
  const settings = useMemo(() => getLocalCustomerSiteSettings(template.slug, template), [template]);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const requests = useMemo(() => listLocalCustomerRequests().filter((request) => request.templateSlug === template.slug), [template.slug]);
  const upcoming = requests.filter((request) => request.status !== CustomerRequestStatus.CANCELLED && request.status !== CustomerRequestStatus.COMPLETED);
  const history = requests.filter((request) => request.status === CustomerRequestStatus.COMPLETED || request.status === CustomerRequestStatus.CANCELLED);
  const vouchers = useMemo(() => listLocalVouchers(template.slug), [template.slug]);
  const [profile, setProfile] = useState(getLocalCustomerProfile());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [voucherForm, setVoucherForm] = useState<{ recipientName: string; recipientEmail: string; value: string; deliveryMethod: VoucherDeliveryMethod; deliveryAddress: string }>({
    recipientName: "",
    recipientEmail: "",
    value: "",
    deliveryMethod: VoucherDeliveryMethod.DIGITAL_EMAIL,
    deliveryAddress: "",
  });
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  function createVoucher(): void {
    const value = Number(voucherForm.value);
    if (!voucherForm.recipientName || !Number.isFinite(value) || value <= 0) {
      setVoucherMessage("Enter recipient name and a valid voucher value.");
      return;
    }
    if (voucherForm.deliveryMethod === VoucherDeliveryMethod.POST && !voucherForm.deliveryAddress.trim()) {
      setVoucherMessage("Voucher delivery address is required when delivery method is Post.");
      return;
    }

    createLocalVoucher(template.slug, {
      valueGbp: value,
      purchaserName: profile.name || "Customer",
      purchaserEmail: profile.email || "customer@example.com",
      recipientName: voucherForm.recipientName,
      recipientEmail: voucherForm.recipientEmail || undefined,
      deliveryMethod: voucherForm.deliveryMethod,
      deliveryAddress: voucherForm.deliveryMethod === VoucherDeliveryMethod.POST ? voucherForm.deliveryAddress : undefined,
    });
    setVoucherMessage("Voucher created locally.");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Customer account</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-200">This is the end-customer portal for bookings, profile details, and vouchers. Platform admin is separate from this site login flow.</p>
        <div className="mt-4"><DemoSiteNav templateSlug={template.slug} /></div>
      </section>

      <DemoAccessDetailsCard />

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Upcoming bookings" subtitle="Your next scheduled appointments.">
          {upcoming.length === 0 ? <p className="text-sm text-slate-600">No upcoming bookings.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {upcoming.map((request) => <li key={request.id}>{request.serviceName || "Service"} - {formatUkDate(request.preferredDate || request.createdAtIso)}{request.preferredTime ? ` at ${request.preferredTime}` : ""}</li>)}
            </ul>
          )}
        </SiteCard>
        <SiteCard title="Booking history" subtitle="Completed and cancelled appointments.">
          {history.length === 0 ? <p className="text-sm text-slate-600">No booking history yet.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {history.map((request) => <li key={request.id}>{request.serviceName || "Service"} - {request.status} ({formatUkDateTime(request.updatedAtIso)})</li>)}
            </ul>
          )}
        </SiteCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Personal details" subtitle="Used to prefill bookings when you are logged in.">
          <div className="space-y-2 text-sm">
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Your name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
            <button type="button" className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800" onClick={() => { const next = saveLocalCustomerProfile({ name: profile.name, email: profile.email, phone: profile.phone }); setProfile(next); setSavedMessage("Profile saved."); }}>
              Save profile
            </button>
            {savedMessage ? <p className="text-xs text-emerald-700">{savedMessage}</p> : null}
          </div>
        </SiteCard>
        <SiteCard title="Payment methods" subtitle="Secure card storage and billing history.">
          <p className="text-sm text-slate-700">Saved cards and receipts will appear here when payments are enabled.</p>
        </SiteCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Gift vouchers" subtitle="Create local voucher requests.">
          <div className="space-y-2 text-sm">
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Recipient name" value={voucherForm.recipientName} onChange={(event) => setVoucherForm((current) => ({ ...current, recipientName: event.target.value }))} />
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Recipient email (optional)" value={voucherForm.recipientEmail} onChange={(event) => setVoucherForm((current) => ({ ...current, recipientEmail: event.target.value }))} />
            <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder={`Voucher value (${formatSiteCurrency(1, currency).replace(/[0-9.,\s]/g,"")})`} value={voucherForm.value} onChange={(event) => setVoucherForm((current) => ({ ...current, value: event.target.value }))} />
            <select className="w-full rounded-md border border-slate-300 px-2 py-1" value={voucherForm.deliveryMethod} onChange={(event) => setVoucherForm((current) => ({ ...current, deliveryMethod: event.target.value as VoucherDeliveryMethod }))}>
              <option value={VoucherDeliveryMethod.DIGITAL_EMAIL}>Email</option>
              <option value={VoucherDeliveryMethod.COLLECT_IN_STORE}>Collect in store</option>
              <option value={VoucherDeliveryMethod.POST}>Post</option>
            </select>
            {voucherForm.deliveryMethod === VoucherDeliveryMethod.POST ? (
              <div>
                <input className="w-full rounded-md border border-slate-300 px-2 py-1" placeholder="Voucher delivery address" value={voucherForm.deliveryAddress} onChange={(event) => setVoucherForm((current) => ({ ...current, deliveryAddress: event.target.value }))} />
                <p className="mt-1 text-xs text-slate-600">Enter the address where the physical voucher should be posted. This can be different from the purchaser’s address.</p>
              </div>
            ) : null}
            <button type="button" className="rounded-md bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800" onClick={createVoucher}>Create voucher</button>
            {voucherMessage ? <p className="text-xs text-slate-600">{voucherMessage}</p> : null}
          </div>
        </SiteCard>

        <SiteCard title="Voucher history" subtitle="Track issued and redeemed vouchers.">
          {vouchers.length === 0 ? <p className="text-sm text-slate-600">No vouchers linked to this account yet.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {vouchers.map((voucher) => (
                <li key={voucher.id}>{voucher.voucherCode} - {formatSiteCurrency(voucher.valueGbp, currency)} - {voucher.status}</li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>
    </main>
  );
}

