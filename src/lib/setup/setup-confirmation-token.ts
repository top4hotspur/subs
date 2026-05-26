import { createHash, randomBytes, timingSafeEqual } from "crypto";

const TOKEN_BYTES = 32;

export function generateSetupConfirmationToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSetupConfirmationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifySetupConfirmationToken(token: string, expectedHash: string): boolean {
  const providedHash = hashSetupConfirmationToken(token);
  const provided = Buffer.from(providedHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export function buildSetupConfirmationParams(requestId: string, token: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("requestId", requestId);
  params.set("source", "backend");
  params.set("token", token);
  return params;
}

