"use client";

import { DemoSiteService } from "@/lib/sites/types";

type ServiceTileSelectorProps = {
  services: DemoSiteService[];
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
};

export function ServiceTileSelector({
  services,
  selectedServiceId,
  onSelectService,
}: ServiceTileSelectorProps) {
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Choose a service
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {services.map((service) => {
          const active = selectedServiceId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelectService(service.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active
                  ? "border-sky-600 bg-sky-50"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{service.name}</p>
              {service.description ? (
                <p className="mt-1 text-xs text-slate-600">{service.description}</p>
              ) : null}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  {service.priceLabel || "Price on request"}
                </span>
                <span className="text-xs font-semibold text-sky-700">
                  {active ? "Selected" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

