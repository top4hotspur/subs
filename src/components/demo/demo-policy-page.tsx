"use client";

import { DemoSitePageShell } from "@/components/demo/demo-site-page-shell";
import { SiteCard } from "@/components/site-ui/site-card";
import { getLocalCustomerSiteSettings } from "@/lib/sites/local-site-settings";
import { WebsiteTemplate } from "@/lib/sites/types";

type DemoPolicyPageProps = {
  template: WebsiteTemplate;
};

export function DemoPolicyPage({ template }: DemoPolicyPageProps) {
  const settings = getLocalCustomerSiteSettings(template.slug, template);
  const businessName = settings.businessDetails.businessName || settings.branding.siteName;
  const policy = settings.policySettings;
  const policyContent = settings.pageContent.policy;
  const policyEnabled = settings.pageVisibility.policy?.enabled ?? true;
  const sameDayLabel =
    policy.noRefundWithinDays === 0
      ? "same day of appointment"
      : `within ${policy.noRefundWithinDays} day(s) of appointment`;

  return (
    <DemoSitePageShell template={template} settings={settings}>
      {!policyEnabled ? (
        <SiteCard title="Policy page currently hidden" subtitle="This page is disabled in business admin settings.">
          <p className="text-sm text-slate-700">
            Enable the policy page from Business Admin to show policy details on the demo site.
          </p>
        </SiteCard>
      ) : (
      <SiteCard
        title={policyContent.title || `${businessName} booking and refund policy`}
        subtitle="Please read these terms before confirming your booking."
      >
        {policyContent.body ? (
          <p className="mb-3 text-sm text-slate-700">{policyContent.body}</p>
        ) : null}
        {policy.cancellationEnabled ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              Cancellations made at least {policy.fullRefundNoticeDays} day(s) before the
              appointment are eligible for a full refund.
            </p>
            <p>
              Cancellations made {sameDayLabel} are not eligible for a refund.
            </p>
            {policy.customPolicyNote ? <p>{policy.customPolicyNote}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-700">
            Cancellation and refund terms are currently managed directly by the business.
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Local/mock policy content only. No real payment/refund processing is active in this demo.
        </p>
      </SiteCard>
      )}
    </DemoSitePageShell>
  );
}
