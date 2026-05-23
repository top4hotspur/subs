"use client";

import { FormEvent, useMemo, useState } from "react";
import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import {
  createLocalInStoreSale,
  listLocalInStoreSales,
} from "@/lib/payments/local-instore-sales";
import {
  createLocalCustomerRequest,
  listLocalCustomerRequests,
} from "@/lib/requests/local-customer-requests";
import {
  CustomerRequestCommunicationChannel,
  CustomerRequestKind,
  CustomerRequestLocationType,
  CustomerRequestPaymentStatus,
  CustomerRequestPricingStatus,
  CustomerRequestStatus,
} from "@/lib/requests/request-types";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";
import { listLocalStaff } from "@/lib/staff/local-staff";
import { formatSiteCurrency, formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";
import {
  findLocalVoucherByCode,
  redeemLocalVoucher,
} from "@/lib/vouchers/local-vouchers";

type DemoStaffPageProps = {
  template: WebsiteTemplate;
};

function paymentStatusLabel(status?: CustomerRequestPaymentStatus): string {
  return status === CustomerRequestPaymentStatus.PAYMENT_COMPLETED ? "Payment Completed" : "Requires Payment";
}

export function DemoStaffPage({ template }: DemoStaffPageProps) {
  const settings = useMemo(() => getLocalCustomerSiteSettings(template.slug, template), [template]);
  const currency = settings.paymentSettings.currencyCode ?? "GBP";
  const requests = useMemo(() => listLocalCustomerRequests().filter((request) => request.templateSlug === template.slug), [template.slug]);
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = requests.filter((request) => request.preferredDate === today);
  const upcomingAppointments = requests.filter((request) => request.preferredDate && request.preferredDate > today);
  const staff = useMemo(() => listLocalStaff(template.slug).filter((member) => member.active), [template.slug]);

  const [phoneBooking, setPhoneBooking] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: settings.services.find((service) => service.active)?.id ?? "",
    preferredDate: today,
    preferredTime: "10:00",
    paymentStatus: CustomerRequestPaymentStatus.PAYMENT_REQUIRED,
    assignedStaffId: "",
  });
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  const [saleForm, setSaleForm] = useState({
    serviceId: settings.services.find((service) => service.active)?.id ?? "",
    staffId: "",
    amount: "",
    paymentMethod: "CASH" as "CASH" | "CARD",
    notes: "",
  });
  const [saleMessage, setSaleMessage] = useState<string | null>(null);
  const sales = listLocalInStoreSales(template.slug);

  function createPhoneBooking(event: FormEvent): void {
    event.preventDefault();
    if (!phoneBooking.customerName || !phoneBooking.customerPhone || !phoneBooking.serviceId) {
      setBookingMessage("Enter customer name, phone, and service.");
      return;
    }
    const service = settings.services.find((item) => item.id === phoneBooking.serviceId);
    const assignedStaff = staff.find((member) => member.id === phoneBooking.assignedStaffId);

    createLocalCustomerRequest({
      templateSlug: template.slug,
      customerName: phoneBooking.customerName,
      customerEmail: "",
      customerPhone: phoneBooking.customerPhone,
      kind: CustomerRequestKind.BOOKING_REQUEST,
      pricingStatus: CustomerRequestPricingStatus.PRICE_CONFIRMED,
      paymentStatus: phoneBooking.paymentStatus,
      paymentRequired: phoneBooking.paymentStatus === CustomerRequestPaymentStatus.PAYMENT_REQUIRED,
      serviceId: phoneBooking.serviceId,
      serviceName: service?.name,
      preferredDate: phoneBooking.preferredDate,
      preferredTime: phoneBooking.preferredTime,
      locationType: CustomerRequestLocationType.BUSINESS_PREMISES,
      notes: "Staff manual booking",
      status: CustomerRequestStatus.CONFIRMED,
      communicationChannels: [CustomerRequestCommunicationChannel.EMAIL],
      createdByStaff: true,
      assignedStaffId: assignedStaff?.id,
      assignedStaffName: assignedStaff?.displayName,
    });
    setBookingMessage("Manual booking created. Auto-response prepared.");
  }

  function checkOrRedeemVoucher(redeem: boolean): void {
    const voucher = findLocalVoucherByCode(template.slug, voucherCode);
    if (!voucher) {
      setVoucherMessage("Voucher not found.");
      return;
    }
    if (!redeem) {
      setVoucherMessage(`Voucher ${voucher.voucherCode} is ${voucher.status} (${formatSiteCurrency(voucher.valueGbp, currency)}).`);
      return;
    }
    if (voucher.status === "REDEEMED") {
      setVoucherMessage(`Voucher ${voucher.voucherCode} is already redeemed.`);
      return;
    }
    redeemLocalVoucher(template.slug, voucher.id, {});
    setVoucherMessage(`Voucher ${voucher.voucherCode} redeemed.`);
  }

  function createInStoreSale(event: FormEvent): void {
    event.preventDefault();
    const amount = Number(saleForm.amount);
    if (!saleForm.serviceId || !Number.isFinite(amount) || amount <= 0) {
      setSaleMessage("Select service and enter a valid amount.");
      return;
    }
    const service = settings.services.find((item) => item.id === saleForm.serviceId);
    const staffMember = staff.find((item) => item.id === saleForm.staffId);
    createLocalInStoreSale(template.slug, {
      serviceId: saleForm.serviceId,
      serviceName: service?.name || "Service",
      staffId: staffMember?.id,
      staffName: staffMember?.displayName,
      amount,
      currency,
      paymentMethod: saleForm.paymentMethod,
      notes: saleForm.notes || undefined,
    });
    setSaleMessage("In-store sale recorded.");
  }

  return (
    <DemoSitePageShell template={template} settings={settings}>
      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Today’s appointments" subtitle={formatUkDate(today)}>
          {todayAppointments.length === 0 ? <p className="text-sm text-slate-600">No appointments scheduled today.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {todayAppointments.map((request) => (
                <li key={request.id}>
                  <div>{request.preferredTime || "Time TBC"} - {request.customerName} - {request.serviceName || "Service"}</div>
                  <div className="text-xs text-slate-600">Assigned: {request.assignedStaffName || "Unassigned"}</div>
                  <div className="text-xs font-semibold text-slate-600">{paymentStatusLabel(request.paymentStatus)}</div>
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
        <SiteCard title="Upcoming appointments" subtitle="Next appointments in the diary.">
          {upcomingAppointments.length === 0 ? <p className="text-sm text-slate-600">No upcoming appointments.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {upcomingAppointments.slice(0, 8).map((request) => (
                <li key={request.id}>
                  <div>{formatUkDate(request.preferredDate || request.createdAtIso)} {request.preferredTime || ""} - {request.customerName}</div>
                  <div className="text-xs text-slate-600">Assigned: {request.assignedStaffName || "Unassigned"}</div>
                  <div className="text-xs font-semibold text-slate-600">{paymentStatusLabel(request.paymentStatus)}</div>
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Create manual booking" subtitle="Capture bookings while speaking with the customer.">
          <form className="grid gap-2" onSubmit={createPhoneBooking}>
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer name" value={phoneBooking.customerName} onChange={(event) => setPhoneBooking((current) => ({ ...current, customerName: event.target.value }))} />
            <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Customer phone" value={phoneBooking.customerPhone} onChange={(event) => setPhoneBooking((current) => ({ ...current, customerPhone: event.target.value }))} />
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={phoneBooking.serviceId} onChange={(event) => setPhoneBooking((current) => ({ ...current, serviceId: event.target.value }))}>
              {settings.services.filter((service) => service.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={phoneBooking.assignedStaffId} onChange={(event) => setPhoneBooking((current) => ({ ...current, assignedStaffId: event.target.value }))}>
              <option value="">Assign staff (optional)</option>
              {staff.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={phoneBooking.preferredDate} onChange={(event) => setPhoneBooking((current) => ({ ...current, preferredDate: event.target.value }))} />
              <input type="time" className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={phoneBooking.preferredTime} onChange={(event) => setPhoneBooking((current) => ({ ...current, preferredTime: event.target.value }))} />
            </div>
            <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={phoneBooking.paymentStatus} onChange={(event) => setPhoneBooking((current) => ({ ...current, paymentStatus: event.target.value as CustomerRequestPaymentStatus }))}>
              <option value={CustomerRequestPaymentStatus.PAYMENT_COMPLETED}>Payment taken at booking</option>
              <option value={CustomerRequestPaymentStatus.PAYMENT_REQUIRED}>Payment required on completion</option>
            </select>
            <button type="submit" className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">Save manual booking</button>
            {bookingMessage ? <p className="text-xs text-slate-600">{bookingMessage}</p> : null}
          </form>
        </SiteCard>

        <SiteCard title="Voucher check and redeem" subtitle="Lookup voucher ID and mark redeemed when used.">
          <div className="space-y-2">
            <input className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Voucher code" value={voucherCode} onChange={(event) => setVoucherCode(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900" onClick={() => checkOrRedeemVoucher(false)}>Check voucher</button>
              <button type="button" className="rounded-md bg-sky-700 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-800" onClick={() => checkOrRedeemVoucher(true)}>Redeem voucher</button>
            </div>
            {voucherMessage ? <p className="text-xs text-slate-600">{voucherMessage}</p> : null}
          </div>
        </SiteCard>
      </div>

      {settings.paymentSettings.allowInStorePaymentRecording ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SiteCard title="Record in-store sale" subtitle="Capture cash/card payments taken in store.">
            <form className="grid gap-2" onSubmit={createInStoreSale}>
              <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={saleForm.serviceId} onChange={(event) => setSaleForm((current) => ({ ...current, serviceId: event.target.value }))}>
                {settings.services.filter((service) => service.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
              <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={saleForm.staffId} onChange={(event) => setSaleForm((current) => ({ ...current, staffId: event.target.value }))}>
                <option value="">Select staff (optional)</option>
                {staff.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
              <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Amount" value={saleForm.amount} onChange={(event) => setSaleForm((current) => ({ ...current, amount: event.target.value }))} />
              <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={saleForm.paymentMethod} onChange={(event) => setSaleForm((current) => ({ ...current, paymentMethod: event.target.value as "CASH" | "CARD" }))}>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
              <input className="rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder="Notes (optional)" value={saleForm.notes} onChange={(event) => setSaleForm((current) => ({ ...current, notes: event.target.value }))} />
              <button type="submit" className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">Save in-store sale</button>
              {saleMessage ? <p className="text-xs text-slate-600">{saleMessage}</p> : null}
            </form>
          </SiteCard>

          <SiteCard title="Recent in-store sales" subtitle="Local-only records for staff finance visibility.">
            {sales.length === 0 ? <p className="text-sm text-slate-600">No in-store sales recorded yet.</p> : (
              <ul className="space-y-2 text-sm text-slate-700">
                {sales.slice(0, 10).map((sale) => (
                  <li key={sale.id}>
                    <div>{sale.serviceName} - {formatSiteCurrency(sale.amount, sale.currency)} ({sale.paymentMethod})</div>
                    <div className="text-xs text-slate-600">{sale.staffName || "Unassigned"} • {formatUkDateTime(sale.createdAtIso)}</div>
                  </li>
                ))}
              </ul>
            )}
          </SiteCard>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">Last updated: {formatUkDateTime(new Date().toISOString())}</p>
    </DemoSitePageShell>
  );
}


