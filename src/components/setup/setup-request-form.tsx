"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getWebsiteSubscriptionOffer } from "@/lib/pricing/subscription-offer";
import { createLocalSetupRequest } from "@/lib/setup/local-setup-requests";
import { createSetupRequestSchema } from "@/lib/setup/setup-request-schema";
import { submitSetupRequestToBackend } from "@/lib/setup/setup-request-backend-client";
import { mapDraftToBackendPayload } from "@/lib/setup/setup-request-mappers";
import {
  getActiveLocalDemoDraftId,
  getLocalDemoDraft,
} from "@/lib/demo/local-demo-drafts";
import { primaryButtonClass } from "@/lib/ui/button-styles";
import {
  CommunicationOption,
  DomainOption,
  SetupRequestDraft,
  SubscriptionSetupStatus,
  WebsiteTemplate,
} from "@/lib/sites/types";
import {
  domainOptionLabel,
  formatGbp,
} from "@/lib/ui/display-labels";
import Link from "next/link";

type SetupRequestFormProps = {
  template: WebsiteTemplate;
};

function readBusinessNameFromActiveDraft(template: WebsiteTemplate): string {
  if (typeof window === "undefined") {
    return template.defaultConfig.businessName;
  }

  const activeId = getActiveLocalDemoDraftId(template.slug);
  if (!activeId) {
    return template.defaultConfig.businessName;
  }

  const draft = getLocalDemoDraft(activeId);
  return draft?.config.businessName || template.defaultConfig.businessName;
}

function readDraftContext(template: WebsiteTemplate): { demoDraftId?: string; demoDraftName?: string } {
  if (typeof window === "undefined") {
    return {};
  }

  const activeId = getActiveLocalDemoDraftId(template.slug);
  if (!activeId) {
    return {};
  }

  const draft = getLocalDemoDraft(activeId);
  if (!draft) {
    return {};
  }

  return {
    demoDraftId: draft.id,
    demoDraftName: draft.draftName,
  };
}

export function SetupRequestForm({ template }: SetupRequestFormProps) {
  const router = useRouter();
  const offer = getWebsiteSubscriptionOffer();
  const draftContext = readDraftContext(template);

  const [draft, setDraft] = useState<SetupRequestDraft>({
    templateSlug: template.slug,
    domainOption: DomainOption.EXISTING_DOMAIN,
    communicationOption: CommunicationOption.EMAIL_ONLY,
    businessName: readBusinessNameFromActiveDraft(template),
    demoDraftId: draftContext.demoDraftId,
    demoDraftName: draftContext.demoDraftName,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const domainFee =
    draft.domainOption === DomainOption.WE_REGISTER_DOMAIN
      ? offer.domainRegistrationFeeGbp
      : 0;
  const monthlyFee =
    offer.monthlyFeeGbp;
  const setupTotal = offer.setupFeeGbp + domainFee;

  function validate(): string[] {
    const issues: string[] = [];

    if (!draft.businessName?.trim()) {
      issues.push("Business name is required.");
    }
    if (!draft.contactName?.trim()) {
      issues.push("Contact name is required.");
    }
    if (!draft.contactEmail?.trim()) {
      issues.push("Contact email is required.");
    }
    if (!draft.contactPhone?.trim()) {
      issues.push("Contact phone is required.");
    }

    if (
      draft.domainOption === DomainOption.EXISTING_DOMAIN &&
      !draft.existingDomain?.trim()
    ) {
      issues.push("Existing domain is required for the selected domain option.");
    }

    if (
      draft.domainOption === DomainOption.WE_REGISTER_DOMAIN &&
      !draft.desiredDomain?.trim()
    ) {
      issues.push("Domain name ideas are required when we register/manage domain.");
    }

    return issues;
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();

          const validationIssues = validate();
          setErrors(validationIssues);
          if (validationIssues.length > 0) {
            return;
          }
          setSubmitting(true);

          const backendPayload = createSetupRequestSchema.parse(
            mapDraftToBackendPayload(draft, {
              setupTotalGbp: setupTotal,
              monthlyTotalGbp: monthlyFee,
            }),
          );
          const backendResult = await submitSetupRequestToBackend(backendPayload);

          if (backendResult.ok) {
            createLocalSetupRequest({
              ...draft,
              id: backendResult.setupRequest.id,
              setupTotalGbp: setupTotal,
              monthlyTotalGbp: monthlyFee,
              createdAtIso: backendResult.setupRequest.createdAt,
              status: SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
            });
            if (backendResult.confirmationUrl) {
              router.push(backendResult.confirmationUrl);
              return;
            }

            if (backendResult.confirmationToken) {
              router.push(
                `/setup/confirmation?requestId=${encodeURIComponent(backendResult.setupRequest.id)}&source=backend&token=${encodeURIComponent(backendResult.confirmationToken)}`,
              );
              return;
            }

            setErrors([
              "We could not verify your confirmation link token. Please submit again.",
            ]);
            setSubmitting(false);
            return;
          }

          if (
            backendResult.status === 0 ||
            backendResult.status === 503 ||
            backendResult.error === "BACKEND_PERSISTENCE_NOT_CONFIGURED" ||
            backendResult.error === "NETWORK_ERROR"
          ) {
            const created = createLocalSetupRequest({
              ...draft,
              setupTotalGbp: setupTotal,
              monthlyTotalGbp: monthlyFee,
              createdAtIso: new Date().toISOString(),
              status: SubscriptionSetupStatus.SETUP_REVIEW_REQUESTED,
            });
            router.push(
              `/setup/confirmation?requestId=${encodeURIComponent(created.id)}&source=local`,
            );
            return;
          }

          if (backendResult.status === 400) {
            setErrors([
              "Backend validation failed. Please review your details and try again.",
            ]);
            setSubmitting(false);
            return;
          }

          setErrors([
            "We could not save your setup request to the backend right now. Please try again.",
          ]);
          setSubmitting(false);
        }}
      >
        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Industry setup details</h2>
          <p className="text-sm text-slate-600">You are setting up: {template.name}</p>
          <p className="text-sm text-slate-600">
            Detailed booking, job, calendar, staff and admin tools are configured during setup based on your business type.
          </p>
          {draft.demoDraftName ? (
            <p className="text-sm text-slate-600">You explored: {draft.demoDraftName}. Your live site still starts clean, ready for your real business data.</p>
          ) : null}
          <label className="block text-sm font-medium text-slate-700">
            Business name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={draft.businessName}
              onChange={(event) =>
                setDraft((c) => ({ ...c, businessName: event.target.value }))
              }
            />
          </label>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Domain option</h2>
          <label className="block text-sm text-slate-700">
            <input
              type="radio"
              name="domain-option"
              className="mr-2"
              checked={draft.domainOption === DomainOption.EXISTING_DOMAIN}
              onChange={() =>
                setDraft((c) => ({ ...c, domainOption: DomainOption.EXISTING_DOMAIN }))
              }
            />
            I already own a domain and can update nameservers/DNS
          </label>
          <label className="block text-sm text-slate-700">
            <input
              type="radio"
              name="domain-option"
              className="mr-2"
              checked={draft.domainOption === DomainOption.CUSTOMER_BUYS_DOMAIN}
              onChange={() =>
                setDraft((c) => ({ ...c, domainOption: DomainOption.CUSTOMER_BUYS_DOMAIN }))
              }
            />
            I will buy my own domain and point it to you
          </label>
          <label className="block text-sm text-slate-700">
            <input
              type="radio"
              name="domain-option"
              className="mr-2"
              checked={draft.domainOption === DomainOption.WE_REGISTER_DOMAIN}
              onChange={() =>
                setDraft((c) => ({ ...c, domainOption: DomainOption.WE_REGISTER_DOMAIN }))
              }
            />
            I want you to register/manage a domain for me (+{formatGbp(offer.domainRegistrationFeeGbp)} one-off)
          </label>

          {draft.domainOption === DomainOption.EXISTING_DOMAIN ? (
            <label className="block text-sm font-medium text-slate-700">
              Your existing domain
              <p className="mt-1 text-xs font-normal text-slate-600">
                Enter the domain you already own. We will tell you what DNS/nameserver changes are needed.
              </p>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="example.co.uk"
                value={draft.existingDomain ?? ""}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, existingDomain: event.target.value }))
                }
              />
            </label>
          ) : null}

          {draft.domainOption === DomainOption.CUSTOMER_BUYS_DOMAIN ? (
            <label className="block text-sm font-medium text-slate-700">
              Planned domain
              <p className="mt-1 text-xs font-normal text-slate-600">
                Optional - tell us the domain you plan to buy or have already found.
              </p>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="example.co.uk"
                value={draft.desiredDomain ?? ""}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, desiredDomain: event.target.value }))
                }
              />
            </label>
          ) : null}

          {draft.domainOption === DomainOption.WE_REGISTER_DOMAIN ? (
            <label className="block text-sm font-medium text-slate-700">
              Domain name ideas
              <p className="mt-1 text-xs font-normal text-slate-600">
                Give us a few options you would be happy with. We will check availability before confirming.
              </p>
              <textarea
                className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder={"firstchoice.co.uk\nsecondchoice.com\nmybusinessname.co.uk"}
                value={draft.desiredDomain ?? ""}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, desiredDomain: event.target.value }))
                }
              />
            </label>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Customer communications</h2>
          <p className="text-sm text-slate-600">
            Email confirmations are included as standard. We will confirm the right communication setup during onboarding.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Contact details</h2>
          <label className="block text-sm font-medium text-slate-700">
            Contact name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={draft.contactName ?? ""}
              onChange={(event) =>
                setDraft((c) => ({ ...c, contactName: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contact email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="your@email.com"
              value={draft.contactEmail ?? ""}
              onChange={(event) =>
                setDraft((c) => ({ ...c, contactEmail: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contact phone
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="07123 456789"
              value={draft.contactPhone ?? ""}
              onChange={(event) =>
                setDraft((c) => ({ ...c, contactPhone: event.target.value }))
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={draft.notes ?? ""}
              onChange={(event) => setDraft((c) => ({ ...c, notes: event.target.value }))}
            />
          </label>
        </section>

        {errors.length > 0 ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
            <p className="font-semibold">Please fix the following:</p>
            <ul className="mt-2 list-disc pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="submit"
          className={primaryButtonClass}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Submit setup request"}
        </button>
        <p className="text-xs text-slate-600">
          Need help before submitting?{" "}
          <Link href="/contact" className="font-medium text-sky-700 hover:text-sky-900">
            Contact us
          </Link>
          .
        </p>
      </form>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Live setup summary</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Industry:</span> {template.name}
          </p>
          <p>
            <span className="font-semibold">Business name:</span> {draft.businessName || "-"}
          </p>
          {draft.demoDraftName ? (
            <p>
              <span className="font-semibold">Demo explored:</span> {draft.demoDraftName}
            </p>
          ) : null}
          <p>
            <span className="font-semibold">Domain option:</span> {domainOptionLabel(draft.domainOption)}
          </p>
          <p><span className="font-semibold">Customer communications:</span> Email notifications included</p>
          <hr className="my-2 border-slate-200" />
          <p>
            <span className="font-semibold">Setup fee:</span> {formatGbp(offer.setupFeeGbp)}
          </p>
          <p>
            <span className="font-semibold">Domain fee:</span> {formatGbp(domainFee)}
          </p>
          <p>
            <span className="font-semibold">Setup total:</span> {formatGbp(setupTotal)}
          </p>
          <p>
            <span className="font-semibold">Monthly fee:</span> {formatGbp(monthlyFee)}
          </p>
          <p>
            <span className="font-semibold">Next step:</span> Submit your setup request and we will confirm domain details and payment/setup onboarding.
          </p>
        </div>
      </aside>
    </div>
  );
}


