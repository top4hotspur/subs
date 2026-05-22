export type SalesEmailTemplateKey =
  | "INITIAL_OUTREACH"
  | "DEMO_FOLLOW_UP"
  | "TRIAL_LINK_FOLLOW_UP"
  | "PRICING_FOLLOW_UP"
  | "NO_RESPONSE_FOLLOW_UP";

export type SalesEmailTemplate = {
  key: SalesEmailTemplateKey;
  label: string;
  subject: string;
  body: string;
};

export type SalesEmailTemplateContext = {
  businessName?: string;
  contactName?: string;
  industry?: string;
  demoLink?: string;
  pricingSummary?: string;
  senderName?: string;
};

export const salesEmailTemplates: SalesEmailTemplate[] = [
  {
    key: "INITIAL_OUTREACH",
    label: "Initial outreach",
    subject: "A website demo for {{businessName}}",
    body:
      "Hi {{contactName}},\n\nI put together a demo website idea for {{businessName}} ({{industry}}). It is designed to help local businesses convert more enquiries and bookings.\n\nIf useful, I can share a quick walk-through and pricing summary: {{pricingSummary}}.\n\nBest,\n{{senderName}}",
  },
  {
    key: "DEMO_FOLLOW_UP",
    label: "Demo follow-up",
    subject: "Quick follow-up on your website demo",
    body:
      "Hi {{contactName}},\n\nFollowing up on the demo for {{businessName}}. Here is the preview link again: {{demoLink}}\n\nHappy to adjust anything before you decide.\n\nBest,\n{{senderName}}",
  },
  {
    key: "TRIAL_LINK_FOLLOW_UP",
    label: "Trial/demo link follow-up",
    subject: "Your demo link for {{businessName}}",
    body:
      "Hi {{contactName}},\n\nHere is your demo link again: {{demoLink}}\n\nYou can review it and tell me any changes you want before launch.\n\nBest,\n{{senderName}}",
  },
  {
    key: "PRICING_FOLLOW_UP",
    label: "Pricing follow-up",
    subject: "Website subscription pricing for {{businessName}}",
    body:
      "Hi {{contactName}},\n\nAs discussed, pricing is {{pricingSummary}}. This includes ongoing management and updates.\n\nIf you want, I can help you get setup started today.\n\nBest,\n{{senderName}}",
  },
  {
    key: "NO_RESPONSE_FOLLOW_UP",
    label: "No-response follow-up",
    subject: "Should I close your website demo file?",
    body:
      "Hi {{contactName}},\n\nJust checking in on the {{businessName}} website demo. If now is not the right time, no problem.\n\nIf you still want to proceed later, I can keep your demo ready: {{demoLink}}\n\nBest,\n{{senderName}}",
  },
];

function replaceVariable(input: string, key: string, value: string): string {
  return input.replaceAll(`{{${key}}}`, value);
}

export function renderSalesEmailTemplate(template: SalesEmailTemplate, context: SalesEmailTemplateContext) {
  const replacements: Record<string, string> = {
    businessName: context.businessName?.trim() || "your business",
    contactName: context.contactName?.trim() || "there",
    industry: context.industry?.trim() || "local services",
    demoLink: context.demoLink?.trim() || "https://www.myexperiment.club/demo",
    pricingSummary: context.pricingSummary?.trim() || "£149 setup + £30/month",
    senderName: context.senderName?.trim() || "MyExperiment.club",
  };

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(replacements)) {
    subject = replaceVariable(subject, key, value);
    body = replaceVariable(body, key, value);
  }

  return { subject, body };
}
