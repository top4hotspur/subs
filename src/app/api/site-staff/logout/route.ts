import { NextResponse } from "next/server";
import { clearSiteStaffSessionCookie } from "@/lib/auth/site-staff-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSiteStaffSessionCookie(response);
  return response;
}
