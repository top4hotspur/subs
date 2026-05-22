import { NextRequest } from "next/server";
import { getOptionalServerEnv } from "@/lib/config/server-env";

export function parsePlatformAdminEmails(): string[] {
  const raw = getOptionalServerEnv("PLATFORM_ADMIN_EMAILS");
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function hasPlatformAdminAccess(request: NextRequest): boolean {
  // Temporary guard until Auth.js is introduced.
  const headerEmail = request.headers.get("x-platform-admin-email")?.trim().toLowerCase();
  if (!headerEmail) return false;
  const allowlist = parsePlatformAdminEmails();
  if (allowlist.length === 0) return false;
  return allowlist.includes(headerEmail);
}
