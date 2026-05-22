import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

function parsePlatformAdminEmails(): string[] {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function isPlatformAdminSession(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return false;
  return parsePlatformAdminEmails().includes(email);
}
