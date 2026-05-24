"use client";

import { signOut } from "next-auth/react";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

export function SiteAdminLogoutButton() {
  return (
    <button
      type="button"
      className={`${outlineButtonClass} ${smallButtonClass}`}
      onClick={() => signOut({ callbackUrl: "/site-admin/login" })}
    >
      Log out
    </button>
  );
}

