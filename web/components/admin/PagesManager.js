"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import PageFormModal from "./PageFormModal";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Select } from "@/components/ui/FormControls";

const VISIBILITY_OPTIONS = [
  { value: "", label: "All visibility" },
  { value: "PUBLIC", label: "Public" },
  { value: "STAFF", label: "Staff only" },
];

const PUBLISHED_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Published" },
  { value: "false", label: "Draft" },
];

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalPage, setModalPage] = useState(null); // null = closed, {} = new, {...} = editing
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLoadError, setModalLoadError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch("/pages/");
      setPages(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // GET /pages/ is documented as never paginated (low volume by design), so
  // filtering the full in-memory list here is accurate, not a stopgap the
  // way it is on the two paginated queues below.
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      if (debouncedQuery && !page.title.toLowerCase().includes(debouncedQuery.toLowerCase())) {
        return false;
      }
      if (visibilityFilter && page.visibility !== visibilityFilter) return false;
      if (publishedFilter && String(page.is_published) !== publishedFilter) return false;
      return true;
    });
  }, [pages, debouncedQuery, visibilityFilter, publishedFilter]);

  const hasActiveFilters = Boolean(query || visibilityFilter || publishedFilter);

  function clearFilters() {
    setQuery("");
    setVisibilityFilter("");
    setPublishedFilter("");
  }

  function openCreate() {
    setModalLoadError("");
    setModalPage({});
  }

  // The list endpoint never includes `body`, only the detail endpoint does,
  // per api-contract.md. Fetch the real record before opening the editor,
  // rather than editing the list-derived stub that's missing its content.
  async function openEdit(listPage) {
    setModalLoadError("");
    setModalLoading(true);
    try {
      const full = await clientFetch(`/pages/${listPage.slug}/`);
      setModalPage(full);
    } catch (err) {
      setModalLoadError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function handleSaved(saved) {
    setPages((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    setModalPage(null);
  }

  async function handleDelete(page) {
    setDeletingId(page.id);
    setDeleteError("");
    try {
      await clientFetch(`/pages/${page.id}/`, { method: "DELETE" });
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      setDeleteConfirmId(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded bg-accent text-white"
        >
          <Plus className="w-4 h-4" /> New page
        </button>
        {modalLoading && <span className="text-xs text-muted">Loading page...</span>}
      </div>
      {modalLoadError && (
        <ErrorMessage className="mb-3">
          Couldn't load that page for editing: {modalLoadError}
        </ErrorMessage>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search pages by title..."
            loading={query !== debouncedQuery}
          />
        </div>
        <Select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          fullWidth={false}
          aria-label="Filter by visibility"
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={publishedFilter}
          onChange={(e) => setPublishedFilter(e.target.value)}
          fullWidth={false}
          aria-label="Filter by status"
        >
          {PUBLISHED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {status === "error" && <ErrorMessage>{errorMsg}</ErrorMessage>}
      {status === "ready" && pages.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No pages yet"
          description="Create one for policies, guides or staff notes."
        />
      )}
      {status === "ready" && pages.length > 0 && filteredPages.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No pages match these filters"
          action={
            hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-accent hover:underline">
                Clear filters
              </button>
            )
          }
        />
      )}
      {status === "ready" && filteredPages.length > 0 && (
        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {filteredPages.map((page) => (
            <div key={page.id} className="flex items-center justify-between py-3 px-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{page.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      page.is_published
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-100 dark:bg-gray-800 text-muted"
                    }`}
                  >
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-muted">
                    {page.visibility === "STAFF" ? "Staff" : "Public"}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">/pages/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-muted">
                <button
                  onClick={() => openEdit(page)}
                  disabled={modalLoading}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent disabled:opacity-40 transition-colors"
                  aria-label={`Edit ${page.title}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {deleteConfirmId === page.id ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(page)}
                      disabled={deletingId === page.id}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                    >
                      {deletingId === page.id ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={deletingId === page.id}
                      className="text-xs px-2 py-1 rounded border border-[var(--color-border)] text-muted disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(page.id)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
                    aria-label={`Delete ${page.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteError && <ErrorMessage size="xs" className="mt-2">{deleteError}</ErrorMessage>}

      {modalPage !== null && (
        <PageFormModal
          page={Object.keys(modalPage).length ? modalPage : null}
          onClose={() => setModalPage(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}