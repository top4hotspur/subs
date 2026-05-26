import { Resend } from "resend";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type TransactionalEmailResult =
  | { ok: true; skipped: false; providerMessageId?: string }
  | { ok: false; skipped: true; reason: "EMAIL_NOT_CONFIGURED" }
  | { ok: false; skipped: false; reason: "EMAIL_SEND_FAILED" };

function getEmailConfig() {
  const apiKey = getOptionalServerEnv("RESEND_API_KEY");
  const from = getOptionalServerEnv("EMAIL_FROM");
  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  const { apiKey, from } = getEmailConfig();
  return Boolean(apiKey && from);
}

export async function sendTransactionalEmail(
  input: TransactionalEmailInput,
): Promise<TransactionalEmailResult> {
  const { apiKey, from } = getEmailConfig();
  if (!apiKey || !from) {
    return { ok: false, skipped: true, reason: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });

    if (result.error) {
      return { ok: false, skipped: false, reason: "EMAIL_SEND_FAILED" };
    }

    return { ok: true, skipped: false, providerMessageId: result.data?.id };
  } catch {
    return { ok: false, skipped: false, reason: "EMAIL_SEND_FAILED" };
  }
}
