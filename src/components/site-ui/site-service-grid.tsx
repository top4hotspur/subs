import { SiteCard } from "@/components/site-ui/site-card";

type ServiceItem = {
  id: string;
  name: string;
  description?: string;
  priceLabel?: string;
};

type SiteServiceGridProps = {
  services: ServiceItem[];
};

export function SiteServiceGrid({ services }: SiteServiceGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <SiteCard
          key={service.id}
          title={service.name}
          subtitle={service.description || "Professional service tailored to local customers."}
        >
          {service.priceLabel ? <p className="text-sm font-medium text-slate-700">{service.priceLabel}</p> : null}
        </SiteCard>
      ))}
    </div>
  );
}


