"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, School } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import SchoolFormModal from "./SchoolFormModal";
import SchoolAdminRow from "./SchoolAdminRow";

const FILTER_TABS = [
  { key: "", label: "All" },
  { key: "true", label: "Active" },
  { key: "false", label: "Inactive" },
];

export default function SchoolsManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [activeFilter, setActiveFilter] = useState("");
  const [schools, setSchools] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      // is_active is admin only on the backend, and omitted for "All"
      if (activeFilter) params.set("is_active", activeFilter);
      params.set("page", page);
      return clientFetch(`/schools/?${params.toString()}`);
    },
    [debouncedQuery, activeFilter]
  );

  useEffect(() => {
    const id = ++requestId.current;
    setStatus("loading");
    setErrorMsg("");
    setLoadMoreError("");
    fetchPage(1)
      .then((data) => {
        if (id !== requestId.current) return;
        setSchools(data.results);
        setCount(data.count);
        setNextPage(data.next ? 2 : null);
        setStatus("ready");
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [fetchPage]);

  async function handleLoadMore() {
    const id = requestId.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      if (id !== requestId.current) return;
      setSchools((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (id === requestId.current) setLoadMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function belongsInView(school) {
    if (activeFilter === "true") return school.is_active !== false;
    if (activeFilter === "false") return school.is_active === false;
    return true;
  }

  function handleCreated(school) {
    if (belongsInView(school)) {
      setSchools((prev) => [school, ...prev]);
      setCount((prev) => prev + 1);
    }
    setShowCreate(false);
  }

  function handleUpdated(updated) {
    if (!belongsInView(updated)) {
      // Deactivating on the Active tab (or reactivating on Inactive) moves
      // the school out of this view.
      setSchools((prev) => prev.filter((s) => s.id !== updated.id));
      setCount((prev) => Math.max(prev - 1, 0));
      return;
    }
    setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  const emptyTitle =
    activeFilter === "false"
      ? "No inactive schools"
      : activeFilter === "true"
      ? "No active schools"
      : "No schools found";

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search schools..."
            loading={query !== debouncedQuery}
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded bg-accent text-white whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New school
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key || "all"}
            onClick={() => setActiveFilter(t.key)}
            aria-pressed={activeFilter === t.key}
            className={`text-xs px-3 py-1 rounded border ${
              activeFilter === t.key
                ? "border-accent text-accent"
                : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <ErrorMessage>{errorMsg}</ErrorMessage>}
      {status === "ready" && schools.length === 0 && (
        <EmptyState
          icon={School}
          title={emptyTitle}
          description={debouncedQuery ? "Try a different search." : undefined}
        />
      )}
      {status === "ready" && schools.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {count} school{count !== 1 ? "s" : ""}
          </p>
          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {schools.map((school) => (
              <SchoolAdminRow key={school.id} school={school} onUpdated={handleUpdated} />
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

      {showCreate && <SchoolFormModal onClose={() => setShowCreate(false)} onSaved={handleCreated} />}
    </div>
  );
}