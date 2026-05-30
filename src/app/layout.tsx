import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyExperiment.club | Managed Subscription Websites",
  description:
    "Professional, feature rich websites for local service businesses with cheap monthly fee, managed setup, and ongoing support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
