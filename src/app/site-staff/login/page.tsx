import { Suspense } from "react";
import { SiteStaffLoginForm } from "@/components/site-staff/site-staff-login-form";

export default function SiteStaffLoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <Suspense fallback={<p className="text-sm text-slate-600">Loading staff login...</p>}>
        <SiteStaffLoginForm />
      </Suspense>
    </main>
  );
}
