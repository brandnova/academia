"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

export default function FilterSidebar({ children, onClear, hasActiveFilters, activeCount }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="md:sticky md:top-4 md:self-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden w-full flex items-center justify-between gap-2 px-4 py-2.5 mb-3 rounded-lg border border-[var(--color-border)] text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-semibold">
              {typeof activeCount === "number" ? activeCount : "•"}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`${
          open ? "block" : "hidden"
        } md:block border border-[var(--color-border)] rounded-lg p-4 space-y-4`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Filter
          </h2>
          {hasActiveFilters && (
            <button onClick={onClear} className="text-xs text-accent hover:underline">
              Clear all
            </button>
          )}
        </div>
        {children}
      </div>
    </aside>
  );
}

export function FilterSection({ title, children }) {
  return (
    <div className="pt-4 first:pt-0 border-t first:border-t-0 border-[var(--color-border)]">
      <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}