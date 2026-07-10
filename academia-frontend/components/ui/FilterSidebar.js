export default function FilterSidebar({ children, onClear, hasActiveFilters }) {
  return (
    <aside className="space-y-6">
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
    </aside>
  );
}

export function FilterSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  );
}