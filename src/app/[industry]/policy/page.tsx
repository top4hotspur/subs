import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebsiteTemplate } from "@/lib/sites/mock-repository";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { isWebsiteTemplateSlug, WEBSITE_TEMPLATE_SLUGS } from "@/lib/sites/types";

type Props = { params: Promise<{ industry: string }> };

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_SLUGS.map((industry) => ({ industry }));
}

export default async function IndustryPolicyPage({ params }: Props) {
  const { industry } = await params;
  if (!isWebsiteTemplateSlug(industry)) notFound();
  const template = getWebsiteTemplate(industry);
  if (!template) notFound();

  const settings = getLocalCustomerSiteSettings(industry, template);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">{template.name} Policy</h1>
      <p className="mt-2 text-sm text-slate-600">Standard policy page placeholder for this site template.</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Payment options</h2>
        <p className="text-sm text-slate-700">Card payments: {settings.paymentSettings.cardPaymentsEnabled ? "Enabled" : "Disabled"}</p>
        <p className="text-sm text-slate-700">Cash payments: {settings.paymentSettings.cashPaymentsEnabled ? "Enabled" : "Disabled"}</p>
        {settings.paymentSettings.cashPaymentsEnabled ? (
          <p className="text-xs text-amber-700">Cash bookings increase no-show risk because payment is not taken upfront.</p>
        ) : null}
        <p className="text-sm text-slate-700">Prepayment required: {settings.paymentSettings.requirePrepaymentForBookings ? "Yes" : "No"}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Cancellation and refunds</h2>
        <p className="text-sm text-slate-700">
          Bookings can be cancelled up to {settings.cancellationPolicy.cancellationWindowHours} hours in advance for a full refund.
          No refund is available after this notice period.
        </p>
        {settings.cancellationPolicy.policyText ? <p className="text-sm text-slate-700">{settings.cancellationPolicy.policyText}</p> : null}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Communications</h2>
        <p className="text-sm text-slate-700">Email notifications are included as standard.</p>
        <p className="text-sm text-slate-700">WhatsApp updates are optional and depend on add-on enablement.</p>
      </section>

      <p className="mt-6 text-xs text-slate-500">Local/mock policy content only. No legal review or backend enforcement is applied in this demo.</p>
      <div className="mt-4"><Link href={`/${industry}`} className="text-sky-700 hover:text-sky-900">Back to {template.category} page</Link></div>
    </main>
  );
}

