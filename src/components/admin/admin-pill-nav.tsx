"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { outlineButtonClass, primaryButtonClass } from "@/lib/ui/button-styles";

type AdminNavItem = {
  href: string;
  label: string;
  startsWith?: string;
};

const items: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Business Site Settings Demo" },
  { href: "/admin/sales", label: "Sales Pipeline" },
  { href: "/admin/contact-enquiries", label: "Contact Enquiries" },
  { href: "/admin/setup-requests", label: "Setup Requests" },
  { href: "/admin/sites", label: "Subscriber Sites", startsWith: "/admin/sites" },
];

export function AdminPillNav() {
  const pathname = usePathname();

  function isActive(item: AdminNavItem): boolean {
    if (!pathname) return false;
    if (item.startsWith) return pathname.startsWith(item.startsWith);
    return pathname === item.href;
  }

  return (
    <nav aria-label="Admin navigation" className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isActive(item) ? primaryButtonClass : outlineButtonClass}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
