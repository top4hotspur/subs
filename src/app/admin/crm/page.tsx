"use client";

import { useState } from "react";
import { AdminPillNav } from "@/components/admin/admin-pill-nav";
import { CustomerCrmPanel } from "@/components/crm/customer-crm-panel";
import { buildCustomersFromLocalRequests, listLocalCustomers } from "@/lib/crm/local-customers";
import { listLocalCustomerRequests } from "@/lib/requests/local-customer-requests";

export default function AdminCrmPage() {
  const [customers, setCustomers] = useState(() => listLocalCustomers());
  const [requests, setRequests] = useState(() => listLocalCustomerRequests());

  function refresh() {
    setCustomers(listLocalCustomers());
    setRequests(listLocalCustomerRequests());
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Customer CRM (mock)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Local browser-only CRM preview. No real backend, auth, or database persistence is configured.
      </p>
      <AdminPillNav />

      <div className="mt-6">
        <CustomerCrmPanel
          customers={customers}
          requests={requests}
          onRefresh={refresh}
          onBuildFromRequests={() => {
            buildCustomersFromLocalRequests(requests);
            refresh();
          }}
          showBackToAdminLink
        />
      </div>
    </main>
  );
}
