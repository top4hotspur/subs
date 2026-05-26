import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { listContactEnquiries } from "@/lib/contact/contact-enquiry-repository";
import { listContactEnquiriesSchema } from "@/lib/contact/contact-enquiry-schema";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const search = request.nextUrl.searchParams;
    const parsed = listContactEnquiriesSchema.parse({
      status: search.get("status") ?? undefined,
      email: search.get("email") ?? undefined,
      industrySlug: search.get("industrySlug") ?? undefined,
      take: search.get("take") ? Number(search.get("take")) : undefined,
      skip: search.get("skip") ? Number(search.get("skip")) : undefined,
    });

    const enquiries = await listContactEnquiries(parsed);
    return NextResponse.json({ ok: true, enquiries });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "CONTACT_ENQUIRY_LIST_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

