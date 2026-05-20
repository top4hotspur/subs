"use client";

import Link from "next/link";
import { getActiveLocalDemoDraftId } from "@/lib/demo/local-demo-drafts";
import { WebsiteTemplateSlug } from "@/lib/sites/types";
import { useState } from "react";

type DemoDraftNoticeProps = {
  templateSlug: WebsiteTemplateSlug;
};

export function DemoDraftNotice({ templateSlug }: DemoDraftNoticeProps) {
  const [hasDraft] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(getActiveLocalDemoDraftId(templateSlug));
  });

  if (!hasDraft) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
      You have a customised demo draft in this browser. {" "}
      <Link href={`/demo/${templateSlug}/customise`} className="font-semibold underline">
        Continue editing
      </Link>
      .
    </div>
  );
}
