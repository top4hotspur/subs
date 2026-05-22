"use client";

import { signOut } from "next-auth/react";
import { outlineButtonClass, smallButtonClass } from "@/lib/ui/button-styles";

export function AdminLogoutButton() {
  return (
    <button
      type="button"
      className={`${outlineButtonClass} ${smallButtonClass}`}
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
    >
      Log out
    </button>
  );
}
