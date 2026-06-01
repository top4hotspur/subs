import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "subs-dev-unsubscribe";

function signature(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSalesUnsubscribeToken(leadId: string): string {
  const payload = `${leadId}.${Date.now()}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySalesUnsubscribeToken(token: string): { leadId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [leadId, ts, sig] = parts;
  const payload = `${leadId}.${ts}`;
  if (signature(payload) !== sig) return null;
  return { leadId };
}
