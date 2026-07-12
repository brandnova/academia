"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

export default function TagsPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [sortPopular, setSortPopular] = useState(true);
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTags = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      if (sortPopular) params.set("popular", "true");
      const data = await clientFetch(`/tags/?${params.toString()}`);
      setTags(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [debouncedQuery, sortPopular]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Tags</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Browse questions by topic.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search tags..."
            loading={query !== debouncedQuery}
          />
        </div>
        <button
          onClick={() => setSortPopular((prev) => !prev)}
          className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600 whitespace-nowrap"
        >
          {sortPopular ? "Sorted by popularity" : "Sorted A–Z"}
        </button>
      </div>

      {status === "loading" && (
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm">
          Couldn't load tags: {errorMsg}
        </p>
      )}

      {status === "ready" && tags.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No tags found{debouncedQuery ? ` for "${debouncedQuery}"` : ""}.
        </p>
      )}

      {status === "ready" && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:border-accent hover:text-accent transition-colors"
            >
              {tag.name}
              <span className="text-xs text-gray-400">{tag.question_count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}