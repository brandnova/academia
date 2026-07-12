"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import QuestionListRow from "@/components/questions/QuestionListRow";
import FilterSidebar, { FilterSection } from "@/components/ui/FilterSidebar";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ANSWERED", label: "Answered" },
  { value: "SOLVED", label: "Solved" },
];

export default function HubQuestionList({ hubId, departments }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      params.set("hub", hubId);
      if (debouncedQuery) params.set("search", debouncedQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (departmentFilter) params.set("department", departmentFilter);
      params.set("ordering", ordering);
      params.set("page", page);
      return clientFetch(`/questions/?${params.toString()}`);
    },
    [hubId, debouncedQuery, statusFilter, departmentFilter, ordering]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.results);
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
      setQuestions((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setLoadMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasActiveFilters = Boolean(statusFilter || departmentFilter);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 mt-8">
      <FilterSidebar
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setStatusFilter("");
          setDepartmentFilter("");
        }}
      >
        <FilterSection title="Status">
          <div className="space-y-1">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={statusFilter === opt.value}
                  onChange={() => setStatusFilter(opt.value)}
                  className="border-gray-300 dark:border-gray-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </FilterSection>

        {departments.length > 0 && (
          <FilterSection title="Department">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterSection>
        )}
      </FilterSidebar>

      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search questions..."
              loading={query !== debouncedQuery}
            />
          </div>
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="-views">Most viewed</option>
            <option value="views">Least viewed</option>
          </select>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm">
            Couldn't load questions: {errorMsg}
          </p>
        )}

        {status === "ready" && questions.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No questions yet{hasActiveFilters || debouncedQuery ? " matching these filters" : ""}.
          </p>
        )}

        {status === "ready" && questions.length > 0 && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {count} question{count !== 1 ? "s" : ""}
            </p>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700 stagger-list">
              {questions.map((q) => (
                <QuestionListRow key={q.id} question={q} />
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