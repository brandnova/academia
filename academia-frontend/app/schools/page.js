"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import SchoolListRow from "@/components/schools/SchoolListRow";
import { INSTITUTION_TYPE_OPTIONS, OWNERSHIP_OPTIONS } from "@/lib/schoolLabels";

export default function SchoolsPage() {
  const [query, setQuery] = useState("");
  const [hasHubOnly, setHasHubOnly] = useState(false);
  const [institutionType, setInstitutionType] = useState("");
  const [ownership, setOwnership] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const debouncedState = useDebouncedValue(stateQuery, 500);

  const [schools, setSchools] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      if (hasHubOnly) params.set("has_hub", "true");
      if (institutionType) params.set("institution_type", institutionType);
      if (ownership) params.set("ownership", ownership);
      if (debouncedState) params.set("state", debouncedState);
      params.set("page", page);
      return clientFetch(`/schools/?${params.toString()}`);
    },
    [debouncedQuery, hasHubOnly, institutionType, ownership, debouncedState]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");

    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setSchools(data.results);
        setCount(data.count);
        setNextPage(data.next ? 2 : null);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      setSchools((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setLoadMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasActiveFilters = Boolean(
    hasHubOnly || institutionType || ownership || stateQuery
  );

  function clearFilters() {
    setHasHubOnly(false);
    setInstitutionType("");
    setOwnership("");
    setStateQuery("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Filter
          </h2>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-accent hover:underline">
              Clear all
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hasHubOnly}
            onChange={(e) => setHasHubOnly(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Has active hub
        </label>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Institution type
          </label>
          <select
            value={institutionType}
            onChange={(e) => setInstitutionType(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All types</option>
            {INSTITUTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Ownership
          </label>
          <select
            value={ownership}
            onChange={(e) => setOwnership(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">All ownership types</option>
            {OWNERSHIP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            State
          </label>
          <input
            value={stateQuery}
            onChange={(e) => setStateQuery(e.target.value)}
            placeholder="e.g. Lagos"
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
      </aside>

      <div>
        <div className="mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search schools by name..."
            loading={query !== debouncedQuery}
          />
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm">
            Couldn't load schools: {errorMsg}
          </p>
        )}

        {status === "ready" && schools.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No schools found
            {debouncedQuery ? ` for "${debouncedQuery}"` : ""}
            {hasActiveFilters ? " matching these filters" : ""}.
          </p>
        )}

        {status === "ready" && schools.length > 0 && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {count} school{count !== 1 ? "s" : ""}
            </p>
            <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
              {schools.map((school) => (
                <SchoolListRow key={school.id} school={school} />
              ))}
            </div>
          </>
        )}

        {nextPage && status === "ready" && (
          <div className="mt-4 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "View more"}
            </button>
            {loadMoreError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2">{loadMoreError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}