"use client";

import { useState } from "react";

type FaqItem = {
  q: string;
  a: string;
};

type HomeFaqAccordionProps = {
  items: FaqItem[];
};

export function HomeFaqAccordion({ items }: HomeFaqAccordionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  function toggle(question: string) {
    setOpenItems((current) => ({
      ...current,
      [question]: !current[question],
    }));
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = Boolean(openItems[item.q]);

        return (
          <div key={item.q} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-slate-900"
              onClick={() => toggle(item.q)}
            >
              <span className="text-sm font-semibold sm:text-base">{item.q}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-sm font-bold text-slate-700">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
