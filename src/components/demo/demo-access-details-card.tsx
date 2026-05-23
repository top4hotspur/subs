import { SiteCard } from "@/components/site-ui/site-card";

type DemoAccessDetailsCardProps = {
  compact?: boolean;
};

export function DemoAccessDetailsCard({ compact = false }: DemoAccessDetailsCardProps) {
  return (
    <SiteCard
      title="Demo access details"
      subtitle="These are preview-only logins for customer, staff, and business admin areas."
    >
      <p className="text-xs text-slate-600">
        These demo logins are for previewing the customer, staff and business admin areas. They do not create real accounts.
      </p>
      <div className={`mt-3 grid gap-3 ${compact ? "md:grid-cols-3" : "sm:grid-cols-3"}`}>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">Customer login</p>
          <p className="mt-1 text-xs text-slate-700">demo.customer@example.com</p>
          <p className="text-xs text-slate-700">demo123</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">Staff login</p>
          <p className="mt-1 text-xs text-slate-700">demo.staff@example.com</p>
          <p className="text-xs text-slate-700">demo123</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">Business admin login</p>
          <p className="mt-1 text-xs text-slate-700">demo.admin@example.com</p>
          <p className="text-xs text-slate-700">demo123</p>
        </div>
      </div>
    </SiteCard>
  );
}
