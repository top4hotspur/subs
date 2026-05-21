"use client";

import { getLowestServicePriceGbp, getPublicServicePriceLabel, serviceHasVariablePricing } from "@/lib/pricing/service-price-display";
import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { StaffRoleDefinition } from "@/lib/staff/staff-role-settings";
import { dangerButtonClass, outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type ServiceEditorProps = {
  services: SiteServiceItem[];
  roleDefinitions?: StaffRoleDefinition[];
  onChange: (services: SiteServiceItem[]) => void;
};

function createEmptyService(index: number): SiteServiceItem {
  return {
    id: `service-${Date.now()}-${index}`,
    name: "New service",
    description: "",
    basePriceGbp: undefined,
    priceLabel: "",
    durationMinutes: undefined,
    bufferAfterMinutes: undefined,
    rolePriceOverrides: [],
    category: "",
    bookable: true,
    requiresQuote: false,
    active: true,
  };
}

export function ServiceEditor({ services, roleDefinitions = [], onChange }: ServiceEditorProps) {
  function updateService(id: string, patch: Partial<SiteServiceItem>) {
    onChange(services.map((service) => (service.id === id ? { ...service, ...patch } : service)));
  }

  function addService() {
    onChange([...services, createEmptyService(services.length + 1)]);
  }

  function duplicateService(service: SiteServiceItem) {
    onChange([
      ...services,
      {
        ...service,
        id: `service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${service.name} (Copy)`,
      },
    ]);
  }

  function removeService(id: string) {
    const target = services.find((service) => service.id === id);
    if (!target) return;
    if (!window.confirm(`Delete service "${target.name}"?`)) return;
    onChange(services.filter((service) => service.id !== id));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Services / products / pricing</h2>
        <button type="button" className={primaryButtonClass} onClick={addService}>Add service</button>
      </div>

      {services.length === 0 ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No services yet.</p> : null}

      <div className="space-y-4">
        {services.map((service) => {
          const roleRows = roleDefinitions.filter((role) => role.active);
          const currentOverrides = service.rolePriceOverrides ?? [];
          const publicLabel = getPublicServicePriceLabel(service);
          return (
            <article key={service.id} className="rounded-xl border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Name
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.name} onChange={(e) => updateService(service.id, { name: e.target.value })} />
                </label>
                <label className="text-sm font-medium text-slate-700">Base price (£)
                  <input type="number" min={0} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.basePriceGbp ?? ""} onChange={(e) => updateService(service.id, { basePriceGbp: e.target.value ? Number(e.target.value) : undefined })} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description
                  <textarea className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.description} onChange={(e) => updateService(service.id, { description: e.target.value })} />
                </label>
                <label className="text-sm font-medium text-slate-700">Duration (minutes)
                  <input type="number" min={0} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.durationMinutes ?? ""} onChange={(e) => updateService(service.id, { durationMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                </label>
                <label className="text-sm font-medium text-slate-700">Buffer after service/job (minutes)
                  <input type="number" min={0} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.bufferAfterMinutes ?? ""} onChange={(e) => updateService(service.id, { bufferAfterMinutes: e.target.value ? Number(e.target.value) : undefined })} />
                  <span className="mt-1 block text-xs font-normal text-slate-500">Extra time blocked after this service before the next booking can start.</span>
                </label>
                <label className="text-sm font-medium text-slate-700">Manual price label
                  <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" value={service.priceLabel ?? ""} onChange={(e) => updateService(service.id, { priceLabel: e.target.value })} />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Used when no numeric price is set, or when you want wording like &quot;Quote required&quot;, &quot;POA&quot; or &quot;From £25&quot;.
                  </span>
                </label>
              </div>

              {roleRows.length > 0 ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Role-level pricing overrides</p>
                    <button
                      type="button"
                      className={outlineButtonClass}
                      onClick={() => {
                        const base = service.basePriceGbp;
                        if (typeof base !== "number") return;
                        const next = roleRows.map((role) => ({ roleId: role.id, roleLabel: role.label, priceGbp: base }));
                        updateService(service.id, { rolePriceOverrides: next });
                      }}
                    >
                      Copy base price to roles
                    </button>
                  </div>
                  <div className="space-y-2">
                    {roleRows.map((role) => {
                      const existing = currentOverrides.find((override) => override.roleId === role.id || override.roleLabel === role.label);
                      return (
                        <div key={role.id} className="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center">
                          <p className="text-sm text-slate-700">{role.label}</p>
                          <input
                            type="number"
                            min={0}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                            value={existing?.priceGbp ?? ""}
                            onChange={(e) => {
                              const price = e.target.value ? Number(e.target.value) : undefined;
                              const nextOverrides = currentOverrides.filter((override) => !(override.roleId === role.id || override.roleLabel === role.label));
                              if (typeof price === "number") {
                                nextOverrides.push({ roleId: role.id, roleLabel: role.label, priceGbp: price });
                              }
                              updateService(service.id, { rolePriceOverrides: nextOverrides });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-2 text-xs text-slate-600">
                {publicLabel ? `Public site will show ${publicLabel}` : "Public site price not set yet."}
                {serviceHasVariablePricing(service) && getLowestServicePriceGbp(service) !== null
                  ? ` (From £${getLowestServicePriceGbp(service)})`
                  : ""}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={service.bookable} onChange={(e) => updateService(service.id, { bookable: e.target.checked })} />Bookable</label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={service.requiresQuote} onChange={(e) => updateService(service.id, { requiresQuote: e.target.checked })} />Requires quote</label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={service.active} onChange={(e) => updateService(service.id, { active: e.target.checked })} />Active</label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => duplicateService(service)}>Duplicate</button>
                <button type="button" className={outlineButtonClass} onClick={() => updateService(service.id, { active: !service.active })}>{service.active ? "Deactivate" : "Reactivate"}</button>
                <button type="button" className={dangerButtonClass} onClick={() => removeService(service.id)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

