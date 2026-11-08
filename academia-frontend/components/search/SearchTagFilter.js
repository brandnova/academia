"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { Input } from "@/components/ui/FormControls";

export default function SearchTagFilter({ value, onChange }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const requestId = useRef(0);

  const fetchSuggestions = useCallback(async (q) => {
    const id = ++requestId.current;
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      else params.set("popular", "true");
      params.set("page_size", "10");
      const data = await clientFetch(`/tags/?${params.toString()}`);
      if (id !== requestId.current) return;
      setSuggestions(data.results);
    } catch {
      if (id !== requestId.current) return;
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
      <Input
        size="sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Filter by tag..."
        aria-label="Filter by tag"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-dropdown mt-1 w-full bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded shadow-lg max-h-48 overflow-auto">
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