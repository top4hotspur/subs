type SiteBrandMarkProps = {
  name: string;
  tagline?: string;
  dark?: boolean;
};

export function SiteBrandMark({ name, tagline, dark = false }: SiteBrandMarkProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold ${dark ? "bg-white/10 text-white" : "bg-slate-900 text-white"}`}>
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <p className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{name}</p>
        {tagline ? <p className={`text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>{tagline}</p> : null}
      </div>
    </div>
  );
}

