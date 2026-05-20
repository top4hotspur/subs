import Link from "next/link";

type FooterLinkGroup = {
  title: string;
  links: { label: string; href: string }[];
};

type SiteFooterBlockProps = {
  brand: string;
  description: string;
  groups: FooterLinkGroup[];
};

export function SiteFooterBlock({ brand, description, groups }: SiteFooterBlockProps) {
  return (
    <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm lg:grid-cols-[1.4fr_2fr] sm:px-8">
      <div>
        <p className="text-lg font-semibold text-slate-900">{brand}</p>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-slate-900">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-slate-900">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

