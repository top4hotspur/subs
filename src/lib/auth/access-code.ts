import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const DERIVED_KEY_LENGTH = 64;

export function generateTemporaryAccessCode(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return value;
}

export function hashAccessCode(accessCode: string): string {
  const normalized = accessCode.trim();
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(normalized, salt, DERIVED_KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyAccessCode(accessCode: string, hash: string | null | undefined): boolean {
  if (!hash) return false;
  const [salt, expectedHex] = hash.split(":");
  if (!salt || !expectedHex) return false;
  const actualHex = scryptSync(accessCode.trim(), salt, DERIVED_KEY_LENGTH).toString("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

