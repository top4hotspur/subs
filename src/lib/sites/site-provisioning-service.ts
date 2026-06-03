import { createSubscriberSiteFromPaidSetupRequest } from "@/lib/provisioning/create-subscriber-site";

export type CreateSubscriberSiteFromSetupRequestResult = Awaited<
  ReturnType<typeof createSubscriberSiteFromPaidSetupRequest>
> & {
  publicUrl: string;
  adminUrl: string;
  message: string;
};

export async function createSubscriberSiteFromSetupRequest(
  setupRequestId: string,
): Promise<CreateSubscriberSiteFromSetupRequestResult> {
  const result = await createSubscriberSiteFromPaidSetupRequest(setupRequestId);

  return {
    ...result,
    publicUrl: result.publicSiteUrl,
    adminUrl: result.adminSiteUrl,
    message: result.created
      ? "Clean subscriber site created from paid setup request."
      : "Existing subscriber site reused for this setup request.",
  };
}
