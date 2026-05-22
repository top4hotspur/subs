"use client";

import { FormEvent, useMemo, useState } from "react";
import { DemoSiteNav } from "@/components/demo/demo-site-nav";
import { SiteCard } from "@/components/site-ui/site-card";
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
import { formatUkDate, formatUkDateTime } from "@/lib/ui/display-labels";
import {
  findLocalVoucherByCode,
  redeemLocalVoucher,
} from "@/lib/vouchers/local-vouchers";

type DemoStaffPageProps = {
  template: WebsiteTemplate;
};

function paymentStatusLabel(status?: CustomerRequestPaymentStatus): string {
  return status === CustomerRequestPaymentStatus.PAYMENT_COMPLETED
    ? "Payment Completed"
    : "Requires Payment";
}

export function DemoStaffPage({ template }: DemoStaffPageProps) {
  const requests = useMemo(
    () => listLocalCustomerRequests().filter((request) => request.templateSlug === template.slug),
    [template.slug],
  );
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = requests.filter((request) => request.preferredDate === today);
  const upcomingAppointments = requests.filter(
    (request) => request.preferredDate && request.preferredDate > today,
  );
  const staff = useMemo(() => listLocalStaff(template.slug).filter((member) => member.active), [template.slug]);
  const settings = useMemo(
    () => getLocalCustomerSiteSettings(template.slug, template),
    [template],
  );

  const [phoneBooking, setPhoneBooking] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: settings.services.find((service) => service.active)?.id ?? "",
    preferredDate: today,
    preferredTime: "10:00",
    paymentStatus: CustomerRequestPaymentStatus.PAYMENT_REQUIRED,
  });
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);

  function createPhoneBooking(event: FormEvent): void {
    event.preventDefault();
    if (!phoneBooking.customerName || !phoneBooking.customerPhone || !phoneBooking.serviceId) {
      setBookingMessage("Enter customer name, phone, and service.");
      return;
    }
    const service = settings.services.find((item) => item.id === phoneBooking.serviceId);
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
    });
    setBookingMessage("Manual booking created successfully.");
  }

  function checkOrRedeemVoucher(redeem: boolean): void {
    const voucher = findLocalVoucherByCode(template.slug, voucherCode);
    if (!voucher) {
      setVoucherMessage("Voucher not found.");
      return;
    }
    if (!redeem) {
      setVoucherMessage(`Voucher ${voucher.voucherCode} is ${voucher.status} (£${voucher.valueGbp.toFixed(2)}).`);
      return;
    }
    if (voucher.status === "REDEEMED") {
      setVoucherMessage(`Voucher ${voucher.voucherCode} is already redeemed.`);
      return;
    }
    redeemLocalVoucher(template.slug, voucher.id, {});
    setVoucherMessage(`Voucher ${voucher.voucherCode} redeemed.`);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Staff portal</p>
        <h1 className="mt-2 text-3xl font-bold">Staff operations</h1>
        <p className="mt-2 text-sm text-slate-200">
          View appointments, manage rota visibility, create manual bookings, and redeem vouchers.
        </p>
        <div className="mt-4">
          <DemoSiteNav templateSlug={template.slug} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Today’s appointments" subtitle={formatUkDate(today)}>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-slate-600">No appointments scheduled today.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {todayAppointments.map((request) => (
                <li key={request.id}>
                  <div>{request.preferredTime || "Time TBC"} - {request.customerName} - {request.serviceName || "Service"}</div>
                  <div className="text-xs font-semibold text-slate-600">{paymentStatusLabel(request.paymentStatus)}</div>
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
        <SiteCard title="Upcoming appointments" subtitle="Next appointments in the diary.">
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-slate-600">No upcoming appointments.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {upcomingAppointments.slice(0, 8).map((request) => (
                <li key={request.id}>
                  <div>{formatUkDate(request.preferredDate || request.createdAtIso)} {request.preferredTime || ""} - {request.customerName}</div>
                  <div className="text-xs font-semibold text-slate-600">{paymentStatusLabel(request.paymentStatus)}</div>
                </li>
              ))}
            </ul>
          )}
        </SiteCard>
      </div>

      <SiteCard title="Rota and team availability" subtitle="Current active staff and availability overview.">
        <ul className="space-y-2 text-sm text-slate-700">
          {staff.map((member) => (
            <li key={member.id}>
              {member.displayName} - {member.availabilityMode}
            </li>
          ))}
        </ul>
      </SiteCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SiteCard title="Create manual booking" subtitle="Capture bookings while speaking with the customer.">
          <form className="grid gap-2" onSubmit={createPhoneBooking}>
            <input
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="Customer name"
              value={phoneBooking.customerName}
              onChange={(event) => setPhoneBooking((current) => ({ ...current, customerName: event.target.value }))}
            />
            <input
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="Customer phone"
              value={phoneBooking.customerPhone}
              onChange={(event) => setPhoneBooking((current) => ({ ...current, customerPhone: event.target.value }))}
            />
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={phoneBooking.serviceId}
              onChange={(event) => setPhoneBooking((current) => ({ ...current, serviceId: event.target.value }))}
            >
              {settings.services
                .filter((service) => service.active)
                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={phoneBooking.preferredDate}
                onChange={(event) => setPhoneBooking((current) => ({ ...current, preferredDate: event.target.value }))}
              />
              <input
                type="time"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={phoneBooking.preferredTime}
                onChange={(event) => setPhoneBooking((current) => ({ ...current, preferredTime: event.target.value }))}
              />
            </div>
            <select
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={phoneBooking.paymentStatus}
              onChange={(event) =>
                setPhoneBooking((current) => ({
                  ...current,
                  paymentStatus: event.target.value as CustomerRequestPaymentStatus,
                }))
              }
            >
              <option value={CustomerRequestPaymentStatus.PAYMENT_COMPLETED}>Payment taken at booking</option>
              <option value={CustomerRequestPaymentStatus.PAYMENT_REQUIRED}>Payment required on completion</option>
            </select>
            <button type="submit" className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">
              Save manual booking
            </button>
            {bookingMessage ? <p className="text-xs text-slate-600">{bookingMessage}</p> : null}
          </form>
        </SiteCard>

        <SiteCard title="Voucher check and redeem" subtitle="Lookup voucher ID and mark redeemed when used.">
          <div className="space-y-2">
            <input
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              placeholder="Voucher code"
              value={voucherCode}
              onChange={(event) => setVoucherCode(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-900"
                onClick={() => checkOrRedeemVoucher(false)}
              >
                Check voucher
              </button>
              <button
                type="button"
                className="rounded-md bg-sky-700 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-800"
                onClick={() => checkOrRedeemVoucher(true)}
              >
                Redeem voucher
              </button>
            </div>
            {voucherMessage ? <p className="text-xs text-slate-600">{voucherMessage}</p> : null}
          </div>
        </SiteCard>
      </div>

      <p className="text-xs text-slate-500">Last updated: {formatUkDateTime(new Date().toISOString())}</p>
    </main>
  );
}
