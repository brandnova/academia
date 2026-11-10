"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/FormControls";

export default function TagMergeControl({ tag, onMerged, onCancel }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const requestId = useRef(0);

  const fetchSuggestions = useCallback(
    async (q) => {
      const id = ++requestId.current;
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        // Paginated list, ten suggestions is plenty for picking a merge target.
        const data = await clientFetch(`/tags/?search=${encodeURIComponent(q)}&page_size=10`);
        if (id !== requestId.current) return;
        setSuggestions(data.results.filter((t) => t.id !== tag.id));
      } catch {
        if (id !== requestId.current) return;
        setSuggestions([]);
      }
    },
    [tag.id]
  );

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  async function merge(payload) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await clientFetch(`/tags/${tag.id}/merge/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onMerged(result);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="mt-2 p-3 rounded border border-[var(--color-border)] bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Merge <strong>{tag.name}</strong> into an existing tag, or type a new
        name to rename it.
      </p>
      <Input
        size="sm"
        className="mb-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search existing tags or type a new name..."
        aria-label="Merge target or new name"
      />
      {suggestions.length > 0 && (
        <div className="border border-[var(--color-border)] rounded mb-2 max-h-40 overflow-auto">
          {suggestions.map((t) => (
            <button
              key={t.id}
              onClick={() => merge({ target_tag_id: t.id })}
              disabled={status === "loading"}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white dark:hover:bg-gray-700 flex items-center justify-between disabled:opacity-50"
            >
              <span>{t.name}</span>
              <span className="text-xs text-gray-400">
                {t.question_count} questions &middot; merge into this
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => merge({ target_name: query.trim().toLowerCase() })}
          disabled={status === "loading" || !query.trim()}
          className="text-xs px-3 py-1.5 rounded bg-accent text-white disabled:opacity-50"
        >
          {status === "loading" ? "Merging..." : `Rename/merge to "${query.trim()}"`}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-400">
          Cancel
        </button>
      </div>
      {status === "error" && (
        <ErrorMessage size="xs" className="mt-2">
          {errorMsg}
        </ErrorMessage>
      )}
    </div>
  );
}