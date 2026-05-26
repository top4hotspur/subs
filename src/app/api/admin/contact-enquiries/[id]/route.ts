import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin";
import { updateContactEnquiryStatus } from "@/lib/contact/contact-enquiry-repository";
import { updateContactEnquiryStatusSchema } from "@/lib/contact/contact-enquiry-schema";
import { isBackendPersistenceConfigured } from "@/lib/config/server-env";

function backendNotConfigured() {
  return NextResponse.json(
    { ok: false, error: "BACKEND_PERSISTENCE_NOT_CONFIGURED" },
    { status: 503 },
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isBackendPersistenceConfigured()) {
    return backendNotConfigured();
  }

  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = updateContactEnquiryStatusSchema.parse({
      id,
      status: body?.status,
    });

    const enquiry = await updateContactEnquiryStatus(input);
    return NextResponse.json({ ok: true, enquiry });
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

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ ok: false, error: "CONTACT_ENQUIRY_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "CONTACT_ENQUIRY_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

