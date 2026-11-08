"use client";

import { useRef } from "react";

// Accessible tab strip. The parent owns which tab is active and renders the
// panels. idBase ties each tab to its panel:
//   tab id    `${idBase}-tab-${key}`
//   panel id  `${idBase}-panel-${key}`  (give the panel role="tabpanel" and
//                                         aria-labelledby of the tab id)
// tabs: [{ key, label, count? }]
export default function Tabs({ tabs, value, onChange, idBase, ariaLabel, className = "" }) {
  const listRef = useRef(null);

  function handleKeyDown(e) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const index = tabs.findIndex((t) => t.key === value);
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    onChange(tabs[next].key);
    listRef.current?.querySelector(`[data-tab-key="${tabs[next].key}"]`)?.focus();
  }

  return (
    <div className={`border-b border-[var(--color-border)] ${className}`}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="flex gap-1 overflow-x-auto"
      >
        {tabs.map((t) => {
          const selected = t.key === value;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${idBase}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              data-tab-key={t.key}
              onClick={() => onChange(t.key)}
              className={`shrink-0 whitespace-nowrap text-sm px-3 py-2 border-b-2 ${
                selected
                  ? "border-accent text-accent font-medium"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-accent"
              }`}
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className="ml-1.5 text-xs text-gray-400">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}