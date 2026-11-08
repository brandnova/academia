"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

export default function TagsBrowseClient() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [sortPopular, setSortPopular] = useState(true);
  const [tags, setTags] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const loadId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      if (sortPopular) params.set("popular", "true");
      params.set("page", page);
      return clientFetch(`/tags/?${params.toString()}`);
    },
    [debouncedQuery, sortPopular]
  );

  useEffect(() => {
    const id = ++loadId.current;
    setStatus("loading");
    setErrorMsg("");
    setLoadMoreError("");
    fetchPage(1)
      .then((data) => {
        if (id !== loadId.current) return;
        setTags(data.results);
        setCount(data.count);
        setNextPage(data.next ? 2 : null);
        setStatus("ready");
      })
      .catch((err) => {
        if (id !== loadId.current) return;
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [fetchPage]);

  async function handleLoadMore() {
    const id = loadId.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      if (!mounted.current || id !== loadId.current) return;
      setTags((prev) => {
        // Popularity order can shift between requests, skip anything already shown.
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...data.results.filter((t) => !seen.has(t.id))];
      });
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (mounted.current && id === loadId.current) setLoadMoreError(err.message);
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }

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
          className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)] whitespace-nowrap"
        >
          {sortPopular ? "Sorted by popularity" : "Sorted A-Z"}
        </button>
      </div>

      {status === "loading" && (
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      )}

      {status === "error" && <ErrorMessage>Couldn't load tags: {errorMsg}</ErrorMessage>}

      {status === "ready" && tags.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No tags found"
          description={debouncedQuery ? `Nothing matches "${debouncedQuery}".` : undefined}
        />
      )}

      {status === "ready" && tags.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {count} tag{count !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${encodeURIComponent(tag.name)}`}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded border border-[var(--color-border-strong)] hover:border-accent hover:text-accent transition-colors"
              >
                {tag.name}
                <span className="text-xs text-gray-400">{tag.question_count}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {nextPage && status === "ready" && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "View more"}
          </button>
          <ErrorMessage className="mt-2">{loadMoreError}</ErrorMessage>
        </div>
      )}
    </div>
  );
}