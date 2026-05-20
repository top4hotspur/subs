import { CustomerSiteSettings } from "@/lib/sites/site-settings-types";

type SiteSettingsSummaryProps = {
  settings: CustomerSiteSettings;
};

function enabledTitles(items: Record<string, { enabled: boolean; title?: string }>): string[] {
  return Object.values(items)
    .filter((item) => item.enabled)
    .map((item) => item.title ?? "Untitled");
}

export function SiteSettingsSummary({ settings }: SiteSettingsSummaryProps) {
  const enabledPages = enabledTitles(settings.pageVisibility);
  const enabledSections = enabledTitles(settings.sectionVisibility);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Standard site settings summary</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Site name:</span> {settings.branding.siteName}</p>
          <p>
            <span className="font-semibold">Logo status:</span>{" "}
            {settings.branding.logoUrl ? "Logo configured" : settings.branding.useTextLogoFallback ? "Text logo fallback" : "Not configured"}
          </p>
          <p><span className="font-semibold">Phone:</span> {settings.businessDetails.phone}</p>
          <p><span className="font-semibold">Email:</span> {settings.businessDetails.email}</p>
          <p><span className="font-semibold">Opening hours:</span> {settings.businessDetails.openingHours}</p>
          <p><span className="font-semibold">Services:</span> {settings.services.length}</p>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Notifications:</span> Email {settings.notifications.emailNotificationsEnabled ? "enabled" : "disabled"}, WhatsApp {settings.notifications.whatsappAddonEnabled ? "enabled" : "disabled"}</p>
          <p><span className="font-semibold">Legal pages:</span> Terms {settings.legal.termsEnabled ? "on" : "off"}, Privacy {settings.legal.privacyEnabled ? "on" : "off"}, Cookies {settings.legal.cookiesEnabled ? "on" : "off"}</p>
          <p><span className="font-semibold">Analytics:</span> {settings.analytics.analyticsEnabled ? "Enabled (placeholder)" : "Disabled"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article>
          <h4 className="text-sm font-semibold text-slate-900">Enabled pages</h4>
          <p className="mt-1 text-sm text-slate-600">{enabledPages.join(", ")}</p>
        </article>
        <article>
          <h4 className="text-sm font-semibold text-slate-900">Enabled homepage sections</h4>
          <p className="mt-1 text-sm text-slate-600">{enabledSections.join(", ")}</p>
        </article>
      </div>
    </section>
  );
}
