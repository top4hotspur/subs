"use client";

import Link from "next/link";
import { MouseEvent } from "react";
import { secondaryButtonClass } from "@/lib/ui/button-styles";
import { WebsiteTemplateSlug } from "@/lib/sites/types";

type IndustryDemoCardCtaProps = {
  industrySlug: WebsiteTemplateSlug;
};

export function IndustryDemoCardCta({ industrySlug }: IndustryDemoCardCtaProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    try {
      window.open(`/demo/${industrySlug}`, "_blank", "noopener,noreferrer");
    } catch {
      // no-op: keep default link navigation if popups are blocked
    }
  }

  return (
    <Link
      href={`/${industrySlug}`}
      onClick={handleClick}
      className={`mt-4 ${secondaryButtonClass}`}
      title="Opens demo in a new window"
      aria-label="View demo site (opens demo in a new window)"
    >
      View demo site
    </Link>
  );
}
