export type SubscriberPaymentProvider =
  | "Stripe"
  | "Square"
  | "SumUp"
  | "PayPal"
  | "Worldpay"
  | "Zettle"
  | "Other";

export type SubscriberPaymentProviderGuidance = {
  provider: SubscriberPaymentProvider;
  title: string;
  accountReferenceLabel: string;
  statusLine: string;
  setupFields: string[];
  instructions: string[];
  warning: string;
};

const COMMON_SECRET_WARNING =
  "Do not enter API keys, secret keys, access tokens, webhook secrets or passwords here. Live provider credentials require secure encrypted storage or provider OAuth/Connect setup before checkout can be enabled.";

export function getSubscriberPaymentProviderGuidance(
  provider: SubscriberPaymentProvider | null | undefined,
): SubscriberPaymentProviderGuidance {
  switch (provider) {
    case "Square":
      return {
        provider: "Square",
        title: "Square setup guidance",
        accountReferenceLabel: "Square merchant/location reference",
        statusLine: "Square checkout is not connected yet. Record the merchant/location reference only.",
        setupFields: ["Merchant/location reference", "Test/live mode in future", "Webhook endpoint/signature verification in future"],
        instructions: [
          "Use this to note the Square business or location that should take customer booking payments.",
          "A future integration must use secure OAuth/token storage and Square webhook validation before online checkout is enabled.",
          "Manual or card-terminal recording can remain available while setup is pending.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "PayPal":
      return {
        provider: "PayPal",
        title: "PayPal setup guidance",
        accountReferenceLabel: "PayPal business email / merchant ID",
        statusLine: "PayPal checkout is not connected yet. Store only the public business reference.",
        setupFields: ["Business email or merchant ID", "Environment/test-live mode in future", "Webhook verification in future"],
        instructions: [
          "Use this to record which PayPal business account the customer expects to use.",
          "A future integration must verify PayPal webhooks and keep any client secrets outside the browser.",
          "Do not treat a PayPal email as proof that payment has been taken.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "SumUp":
      return {
        provider: "SumUp",
        title: "SumUp setup guidance",
        accountReferenceLabel: "SumUp account reference/email",
        statusLine: "SumUp is currently manual/provider-assisted only until API checkout is designed.",
        setupFields: ["Account reference/email", "Manual card-terminal notes", "API support review in future"],
        instructions: [
          "Use this for businesses taking payment through a SumUp terminal or account.",
          "Customer online checkout should stay disabled until a secure SumUp integration is designed.",
          "Manual payment recording can be used for terminal payments.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "Zettle":
      return {
        provider: "Zettle",
        title: "Zettle setup guidance",
        accountReferenceLabel: "Zettle account reference/email",
        statusLine: "Zettle is currently manual/provider-assisted only until API checkout is designed.",
        setupFields: ["Account reference/email", "Manual card-terminal notes", "API support review in future"],
        instructions: [
          "Use this for businesses taking payment through a Zettle terminal or account.",
          "Customer online checkout should stay disabled until a secure Zettle integration is designed.",
          "Manual payment recording can be used for terminal payments.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "Worldpay":
      return {
        provider: "Worldpay",
        title: "Worldpay setup guidance",
        accountReferenceLabel: "Worldpay merchant/account reference",
        statusLine: "Worldpay checkout is not connected yet. Record setup details only.",
        setupFields: ["Merchant/account reference", "Hosted payment configuration in future", "Webhook/callback validation in future"],
        instructions: [
          "Use this to note the Worldpay merchant account that should receive payments.",
          "Provider-specific hosted checkout, callbacks and refund/status handling need a separate design before going live.",
          "Manual payment recording remains the safe fallback.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "Other":
      return {
        provider: "Other",
        title: "Other provider setup guidance",
        accountReferenceLabel: "Provider account reference/email",
        statusLine: "This provider needs review before online checkout can be enabled.",
        setupFields: ["Provider name", "Account reference", "Operational notes"],
        instructions: [
          "Use setup notes to capture provider name, account reference and what the business needs.",
          "We need to review API support, webhook validation and secure credential handling before enabling online checkout.",
          "Manual payment recording remains available while provider support is reviewed.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
    case "Stripe":
    default:
      return {
        provider: "Stripe",
        title: "Stripe setup guidance",
        accountReferenceLabel: "Stripe account ID or Connect account ID",
        statusLine: "Stripe checkout for subscriber bookings is not connected yet. Platform Stripe billing is separate.",
        setupFields: ["Stripe account ID / Connect account ID", "Test/live mode in future", "Webhook signing secret in secure storage in future"],
        instructions: [
          "Use this to record which Stripe account should receive this business's customer booking payments.",
          "Do not reuse MyExperiment.club subscription Stripe credentials for tenant booking payments.",
          "A future integration should prefer Stripe Connect or encrypted tenant credential storage with separate webhook handling.",
        ],
        warning: COMMON_SECRET_WARNING,
      };
  }
}
