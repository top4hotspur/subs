import { SiteFooterBlock } from "@/components/site-ui/site-footer-block";

export function SiteFooter() {
  return (
    <footer className="mt-16 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SiteFooterBlock
          brand="Subs / MyExperiment.club"
          description="Subscription websites for local service businesses with demo-first onboarding, managed setup, and ongoing monthly support."
          groups={[
            {
              title: "Explore",
              links: [
                { label: "Business types", href: "/#industries" },
                { label: "How it works", href: "/#how-it-works" },
              ],
            },
            {
              title: "Portals",
              links: [
                { label: "Customer login (mock)", href: "/account" },
                { label: "Admin login (mock)", href: "/admin" },
              ],
            },
            {
              title: "Project",
              links: [
                { label: "Admin settings", href: "/admin/settings" },
                { label: "Homepage", href: "/" },
              ],
            },
          ]}
        />
        <p className="mt-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} MyExperiment.club. Hosted demo/local mock foundation.</p>
      </div>
    </footer>
  );
}

