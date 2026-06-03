type DomainInstructionInput = {
  businessName: string;
  domainOption?: string | null;
  requestedDomain?: string | null;
  previewUrl: string;
  adminUrl: string;
  dnsTargetInstructions?: string | null;
  supportLine?: string | null;
};

function domainOptionLabel(value?: string | null): string {
  if (value === "EXISTING_DOMAIN") return "Customer-owned domain";
  if (value === "CUSTOMER_BUYS_DOMAIN") return "Customer-managed domain purchase";
  if (value === "WE_REGISTER_DOMAIN") return "MyExperiment.club registered/managed domain";
  return "domain option not confirmed";
}

function domainOptionGuidance(value?: string | null): string {
  if (value === "WE_REGISTER_DOMAIN") {
    return "We will handle the manual registrar/DNS setup for this domain and update you when the domain is ready.";
  }
  if (value === "CUSTOMER_BUYS_DOMAIN") {
    return "When you have access to the domain settings, use the DNS/hosting target details below or send them to whoever manages your domain.";
  }
  if (value === "EXISTING_DOMAIN") {
    return "Please update your existing domain settings using the DNS/hosting target details below, or send them to whoever manages your domain.";
  }
  return "We will confirm the right domain route with you before go-live.";
}

export function buildDnsInstructionsText(input: DomainInstructionInput): string {
  const target = input.dnsTargetInstructions?.trim() || "DNS/hosting target values have not been added yet.";
  const domain = input.requestedDomain?.trim() || "the confirmed customer domain";
  const managedByPlatform = input.domainOption === "WE_REGISTER_DOMAIN";
  const supportLine = input.supportLine?.trim() || "If you are unsure about any DNS step, reply to this email and we will help you through it.";

  if (managedByPlatform) {
    return [
      `Domain setup for ${input.businessName}`,
      "",
      `Domain option: ${domainOptionLabel(input.domainOption)}`,
      `Domain: ${domain}`,
      "",
      domainOptionGuidance(input.domainOption),
      "",
      "DNS / hosting target values:",
      target,
      "",
      `Preview your site while domain setup is being prepared: ${input.previewUrl}`,
      `Business admin area: ${input.adminUrl}`,
      "",
      supportLine,
    ].join("\n");
  }

  return [
    `Domain setup for ${input.businessName}`,
    "",
    `Domain option: ${domainOptionLabel(input.domainOption)}`,
    `Domain: ${domain}`,
    "",
    domainOptionGuidance(input.domainOption),
    "",
    "DNS / hosting target values:",
    target,
    "",
    `Preview your site while DNS is being prepared: ${input.previewUrl}`,
    `Business admin area: ${input.adminUrl}`,
    "",
    supportLine,
  ].join("\n");
}
