import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { PlatformBillingTestClient } from "@/components/admin/platform-billing-test-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBillingTestPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform Billing Test</h1>
          <p className="mt-2 text-sm text-slate-600">
            Test MyExperiment.club platform Stripe Checkout without touching subscriber Stripe Connect bookings.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <AdminPillNav />
      <PlatformBillingTestClient checkout={params.checkout} sessionId={params.session_id} />
    </main>
  );
}
