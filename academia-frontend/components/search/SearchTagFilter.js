"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export default function SearchTagFilter({ value, onChange }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      else params.set("popular", "true");
      const data = await clientFetch(`/tags/?${params.toString()}`);
      setSuggestions(data.results.slice(0, 6));
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (open) fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, open, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-accent/10 text-accent">
        {value}
        <button onClick={() => onChange(null)} aria-label="Clear tag filter">
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Filter by tag..."
        className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded shadow-lg max-h-48 overflow-auto">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onChange(tag.name);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <span>{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.question_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}