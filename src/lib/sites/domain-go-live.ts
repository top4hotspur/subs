type DomainInstructionInput = {
  businessName: string;
  domainOption?: string | null;
  requestedDomain?: string | null;
  previewUrl: string;
  adminUrl: string;
  dnsTarget?: string | null;
};

function domainOptionLabel(value?: string | null): string {
  if (value === "EXISTING_DOMAIN") return "customer owns an existing domain";
  if (value === "CUSTOMER_BUYS_DOMAIN") return "customer will buy/manage the domain";
  if (value === "WE_REGISTER_DOMAIN") return "MyExperiment.club registers/manages the domain";
  return "domain option not confirmed";
}

export function buildDnsInstructionsText(input: DomainInstructionInput): string {
  const target = input.dnsTarget?.trim() || "PENDING_HOSTING_TARGET";
  const domain = input.requestedDomain?.trim() || "the confirmed customer domain";
  const managedByPlatform = input.domainOption === "WE_REGISTER_DOMAIN";

  if (managedByPlatform) {
    return [
      `Domain setup for ${input.businessName}`,
      "",
      `Domain option: ${domainOptionLabel(input.domainOption)}`,
      `Domain: ${domain}`,
      "",
      "Internal note: domain is managed by platform/admin. Configure registrar/DNS manually, then mark the domain ready in platform admin.",
      `Hosting/DNS target: ${target}`,
      "",
      `Preview route: ${input.previewUrl}`,
      `Business admin: ${input.adminUrl}`,
    ].join("\n");
  }

  return [
    `Domain setup for ${input.businessName}`,
    "",
    `Domain option: ${domainOptionLabel(input.domainOption)}`,
    `Domain: ${domain}`,
    "",
    "Please point your domain/DNS to the new MyExperiment.club website.",
    `Hosting/DNS target: ${target}`,
    "",
    "The final hosting target is confirmed during go-live. If you are unsure how to update DNS or nameservers, we can help you through it.",
    "",
    `Preview route while DNS is being prepared: ${input.previewUrl}`,
    `Business admin: ${input.adminUrl}`,
  ].join("\n");
}
