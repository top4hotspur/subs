import { NextResponse } from "next/server";
import { clearSiteCustomerSessionCookie } from "@/lib/auth/site-customer-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSiteCustomerSessionCookie(response);
  return response;
}
