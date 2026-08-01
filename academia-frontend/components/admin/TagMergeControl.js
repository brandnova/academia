"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export default function TagMergeControl({ tag, onMerged, onCancel }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSuggestions = useCallback(
    async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        const data = await clientFetch(`/tags/?search=${encodeURIComponent(q)}`);
        setSuggestions(data.results.filter((t) => t.id !== tag.id));
      } catch {
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
    <div className="mt-2 p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Merge <strong>{tag.name}</strong> into an existing tag, or type a new
        name to rename it.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search existing tags or type a new name..."
        className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-2"
      />
      {suggestions.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded mb-2 max-h-40 overflow-auto">
          {suggestions.map((t) => (
            <button
              key={t.id}
              onClick={() => merge({ target_tag_id: t.id })}
              disabled={status === "loading"}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white dark:hover:bg-gray-700 flex items-center justify-between"
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
        <p className="text-red-600 dark:text-red-400 text-xs mt-2">{errorMsg}</p>
      )}
    </div>
  );
}