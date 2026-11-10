"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Input } from "@/components/ui/FormControls";

export default function UserSearchPicker({ onSelect, excludeIds = [], disabled = false }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const requestId = useRef(0);

  // Callers usually pass a fresh array on every render. Keying the callback on
  // the joined ids keeps it stable, otherwise every parent re-render would
  // re-create it and re-fire the search effect while the list is open, and
  // GET /users/search/ is limited to 60 requests per minute.
  const excludeKey = excludeIds.join(",");

  const search = useCallback(
    async (q) => {
      const id = ++requestId.current;
      if (!q) {
        setResults([]);
        setStatus("idle");
        return;
      }
      setStatus("loading");
      try {
        const data = await clientFetch(`/users/search/?search=${encodeURIComponent(q)}`);
        if (id !== requestId.current) return;
        const excluded = new Set(excludeKey ? excludeKey.split(",") : []);
        setResults(data.results.filter((u) => !excluded.has(u.id)));
        setStatus("ready");
      } catch (err) {
        if (id !== requestId.current) return;
        setErrorText(err.status === 429 ? "Too many searches, wait a moment." : "Search failed.");
        setStatus("error");
      }
    },
    [excludeKey]
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
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search by name or email..."
        aria-label="Search users"
        disabled={disabled}
      />
      {open && debouncedQuery && (
        <div className="absolute z-dropdown mt-1 w-full bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded shadow-lg max-h-48 overflow-auto">
          {status === "loading" && (
            <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>
          )}
          {status === "error" && (
            <p role="alert" className="px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {errorText}
            </p>
          )}
          {status === "ready" && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No matching users.</p>
          )}
          {status === "ready" &&
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(u);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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