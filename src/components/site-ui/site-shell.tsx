import { ReactNode } from "react";
import { siteTheme } from "@/lib/ui/site-theme";

type SiteShellProps = {
  children: ReactNode;
  className?: string;
};

export function SiteShell({ children, className = "" }: SiteShellProps) {
  return <main className={`${siteTheme.pageBg} ${className}`}>{children}</main>;
}

