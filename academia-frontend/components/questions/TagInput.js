"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export default function TagInput({ value, onChange, maxTags = 8 }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) {
        params.set("search", q);
      } else {
        params.set("popular", "true");
      }
      const data = await clientFetch(`/tags/?${params.toString()}`);
      setSuggestions(data.results.slice(0, 8));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, open, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(rawName) {
    const name = rawName.trim().toLowerCase();
    if (!name) return;
    if (value.includes(name)) {
      setQuery("");
      return;
    }
    if (value.length >= maxTags) return;
    onChange([...value, name]);
    setQuery("");
  }

  function removeTag(name) {
    onChange(value.filter((t) => t !== name));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (query.trim()) addTag(query);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const unselectedSuggestions = suggestions.filter((t) => !value.includes(t.name));

  return (
    <div ref={containerRef} className="relative">
      <div className="w-full min-h-[42px] px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-accent/10 text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length < maxTags && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? "Search or add tags..." : ""}
            className="flex-1 min-w-[100px] text-sm bg-transparent outline-none py-0.5"
          />
        )}
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-48 overflow-auto">
          {loading && <p className="px-3 py-2 text-xs text-gray-400">Searching...</p>}
          {!loading && unselectedSuggestions.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">
              {query.trim()
                ? `No matching tags. Press Enter to add "${query.trim().toLowerCase()}" as a new tag.`
                : "No popular tags yet."}
            </p>
          )}
          {!loading &&
            unselectedSuggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag.name)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <span>{tag.name}</span>
                <span className="text-xs text-gray-400">{tag.question_count}</span>
              </button>
            ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Pick an existing tag or type a new one and press Enter. Up to {maxTags} tags.
      </p>
    </div>
  );
}