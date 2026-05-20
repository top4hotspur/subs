const baseButtonClass =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

export const smallButtonClass = "px-3 py-1.5 text-xs";
export const defaultButtonClass = "px-4 py-2 text-sm";
export const largeButtonClass = "px-5 py-3 text-sm";

export const primaryButtonClass = `${baseButtonClass} ${defaultButtonClass} bg-sky-600 text-white hover:bg-sky-700`;
export const secondaryButtonClass = `${baseButtonClass} ${defaultButtonClass} bg-sky-100 text-sky-900 hover:bg-sky-200`;
export const outlineButtonClass = `${baseButtonClass} ${defaultButtonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100`;
export const dangerButtonClass = `${baseButtonClass} ${defaultButtonClass} border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100`;
export const mutedButtonClass = `${baseButtonClass} ${defaultButtonClass} border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200`;
