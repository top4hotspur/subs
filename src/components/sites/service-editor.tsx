"use client";

import { SiteServiceItem } from "@/lib/sites/site-settings-types";
import { dangerButtonClass, outlineButtonClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui/button-styles";

type ServiceEditorProps = {
  services: SiteServiceItem[];
  onChange: (services: SiteServiceItem[]) => void;
};

function createEmptyService(index: number): SiteServiceItem {
  return {
    id: `service-${Date.now()}-${index}`,
    name: "New service",
    description: "",
    priceLabel: "",
    durationMinutes: undefined,
    category: "",
    bookable: true,
    requiresQuote: false,
    active: true,
  };
}

export function ServiceEditor({ services, onChange }: ServiceEditorProps) {
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
    if (!target) {
      return;
    }
    const shouldDelete = window.confirm(`Delete service "${target.name}"?`);
    if (!shouldDelete) {
      return;
    }
    onChange(services.filter((service) => service.id !== id));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Services / products / pricing</h2>
        <button type="button" className={primaryButtonClass} onClick={addService}>
          Add service
        </button>
      </div>

      {services.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          No services yet. Add your first service above.
        </p>
      ) : null}

      <div className="space-y-4">
        {services.map((service) => (
          <article key={service.id} className="rounded-xl border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Name
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.name}
                  onChange={(event) => updateService(service.id, { name: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Price label
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.priceLabel ?? ""}
                  onChange={(event) => updateService(service.id, { priceLabel: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Description
                <textarea
                  className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.description}
                  onChange={(event) => updateService(service.id, { description: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Duration (minutes)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.durationMinutes ?? ""}
                  onChange={(event) =>
                    updateService(service.id, {
                      durationMinutes: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Category
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.category ?? ""}
                  onChange={(event) => updateService(service.id, { category: event.target.value })}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Buffer after service/job (minutes)
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={service.bufferAfterMinutes ?? ""}
                  onChange={(event) =>
                    updateService(service.id, {
                      bufferAfterMinutes: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Extra time blocked after this service before the next booking can start.
                </span>
              </label>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={service.bookable}
                  onChange={(event) => updateService(service.id, { bookable: event.target.checked })}
                />
                Bookable
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={service.requiresQuote}
                  onChange={(event) => updateService(service.id, { requiresQuote: event.target.checked })}
                />
                Requires quote
              </label>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={service.active}
                  onChange={(event) => updateService(service.id, { active: event.target.checked })}
                />
                Active
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => duplicateService(service)}>
                Duplicate
              </button>
              <button
                type="button"
                className={outlineButtonClass}
                onClick={() => updateService(service.id, { active: !service.active })}
              >
                {service.active ? "Deactivate" : "Reactivate"}
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => removeService(service.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
