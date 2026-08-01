"use client";

import { useState, useEffect, useCallback } from "react";
import { GitMerge, Trash2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import TagMergeControl from "./TagMergeControl";

export default function TagsManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [mergingId, setMergingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState({});

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      else params.set("popular", "true");
      const data = await clientFetch(`/tags/?${params.toString()}`);
      setTags(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  function setError(id, msg) {
    setRowError((prev) => ({ ...prev, [id]: msg }));
  }

  async function handleDelete(tag, force = false) {
    setDeletingId(tag.id);
    setError(tag.id, "");
    try {
      await clientFetch(`/tags/${tag.id}/${force ? "?force=true" : ""}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
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

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
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

      {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

      {status === "ready" && tags.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No tags found.</p>
      )}

      {status === "ready" && tags.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
          {tags.map((tag) => (
            <div key={tag.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{tag.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{tag.question_count} questions</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <button
                    onClick={() => setMergingId(mergingId === tag.id ? null : tag.id)}
                    className="hover:text-accent"
                    aria-label={`Merge ${tag.name}`}
                  >
                    <GitMerge className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => (deleteConfirmId === tag.id ? handleDelete(tag, true) : handleDelete(tag))}
                    disabled={deletingId === tag.id}
                    className="hover:text-red-500 disabled:opacity-50"
                    aria-label={`Delete ${tag.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {deleteConfirmId === tag.id && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  Attached to {tag.question_count} questions. Click delete again
                  to force it, this only removes the tag, not the questions.
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="ml-2 text-gray-400 underline"
                  >
                    Cancel
                  </button>
                </p>
              )}

              {rowError[tag.id] && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{rowError[tag.id]}</p>
              )}

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
      )}
    </div>
  );
}