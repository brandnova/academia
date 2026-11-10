"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GitMerge, Tag, Trash2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import TagMergeControl from "./TagMergeControl";

export default function TagsManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [tags, setTags] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [mergingId, setMergingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState({});

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
      else params.set("popular", "true");
      params.set("page", page);
      return clientFetch(`/tags/?${params.toString()}`);
    },
    [debouncedQuery]
  );

  const load = useCallback(async () => {
    const id = ++loadId.current;
    setStatus("loading");
    setErrorMsg("");
    setLoadMoreError("");
    try {
      const data = await fetchPage(1);
      if (id !== loadId.current) return;
      setTags(data.results);
      setCount(data.count);
      setNextPage(data.next ? 2 : null);
      setStatus("ready");
    } catch (err) {
      if (id !== loadId.current) return;
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLoadMore() {
    const id = loadId.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      if (!mounted.current || id !== loadId.current) return;
      setTags((prev) => {
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

  function setError(id, msg) {
    setRowError((prev) => ({ ...prev, [id]: msg }));
  }

  async function handleDelete(tag, force = false) {
    setDeletingId(tag.id);
    setError(tag.id, "");
    try {
      await clientFetch(`/tags/${tag.id}/${force ? "?force=true" : ""}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      setCount((prev) => Math.max(prev - 1, 0));
      setDeleteConfirmId(null);
    } catch (err) {
      if (!force && /pass \?force=true/i.test(err.message)) {
        setDeleteConfirmId(tag.id);
      } else {
        setError(tag.id, err.message);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tags..."
          loading={query !== debouncedQuery}
        />
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {status === "error" && <ErrorMessage>{errorMsg}</ErrorMessage>}

      {status === "ready" && tags.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No tags found"
          description={debouncedQuery ? "Try a different search." : undefined}
        />
      )}

      {status === "ready" && tags.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {count} tag{count !== 1 ? "s" : ""}
          </p>
          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {tags.map((tag) => (
              <div key={tag.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-sm font-medium break-words">{tag.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {tag.question_count} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 shrink-0">
                    <button
                      onClick={() => setMergingId(mergingId === tag.id ? null : tag.id)}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent transition-colors"
                      aria-label={`Merge ${tag.name}`}
                    >
                      <GitMerge className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        deleteConfirmId === tag.id ? handleDelete(tag, true) : handleDelete(tag)
                      }
                      disabled={deletingId === tag.id}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-500 disabled:opacity-50 transition-colors"
                      aria-label={`Delete ${tag.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {deleteConfirmId === tag.id && (
                  <div className="mt-1.5">
                    <ErrorMessage size="xs" tone="warning">
                      Attached to {tag.question_count} questions. Click delete again to force it,
                      this only removes the tag, not the questions.
                    </ErrorMessage>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="mt-0.5 text-xs text-gray-400 underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <ErrorMessage size="xs" className="mt-1.5">
                  {rowError[tag.id]}
                </ErrorMessage>

                {mergingId === tag.id && (
                  <TagMergeControl
                    tag={tag}
                    onMerged={() => {
                      setMergingId(null);
                      load();
                    }}
                    onCancel={() => setMergingId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {nextPage && status === "ready" && (
        <div className="mt-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "View more"}
          </button>
          <ErrorMessage className="mt-2">{loadMoreError}</ErrorMessage>
        </div>
      )}
    </div>
  );
}