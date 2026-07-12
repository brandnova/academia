"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export default function UserSearchPicker({ onSelect, excludeIds = [] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const search = useCallback(
    async (q) => {
      if (!q) {
        setResults([]);
        setStatus("idle");
        return;
      }
      setStatus("loading");
      try {
        const data = await clientFetch(`/users/search/?search=${encodeURIComponent(q)}`);
        setResults(data.results.filter((u) => !excludeIds.includes(u.id)));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [excludeIds]
  );

  useEffect(() => {
    if (open) search(debouncedQuery);
  }, [debouncedQuery, open, search]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or email..."
        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
      />
      {open && debouncedQuery && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded shadow-lg max-h-48 overflow-auto">
          {status === "loading" && (
            <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>
          )}
          {status === "error" && (
            <p className="px-3 py-2 text-xs text-red-600 dark:text-red-400">Search failed.</p>
          )}
          {status === "ready" && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No matching users.</p>
          )}
          {status === "ready" &&
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelect(u);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <p className="font-medium">{u.full_name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}