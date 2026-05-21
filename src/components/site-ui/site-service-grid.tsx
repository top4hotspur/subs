import { SiteCard } from "@/components/site-ui/site-card";
import { getPublicServicePriceLabel } from "@/lib/pricing/service-price-display";

type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  basePriceGbp?: number;
  priceLabel?: string;
  requiresQuote?: boolean;
  rolePriceOverrides?: { roleLabel: string; priceGbp: number }[];
  staffPriceOverrides?: { staffName: string; priceGbp: number }[];
};

type SiteServiceGridProps = {
  services: ServiceItem[];
};

export function SiteServiceGrid({ services }: SiteServiceGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => {
        const label = getPublicServicePriceLabel(service);
        return (
          <SiteCard
            key={service.id}
            title={service.name}
            subtitle={service.description || "Professional service tailored to local customers."}
          >
            {label ? <p className="text-sm font-medium text-slate-700">{label}</p> : null}
          </SiteCard>
        );
      })}
    </div>
  );
}
