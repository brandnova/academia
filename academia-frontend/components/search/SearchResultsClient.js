"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import QuestionListRow from "@/components/questions/QuestionListRow";
import SearchTagFilter from "@/components/search/SearchTagFilter";
import FilterSidebar, { FilterSection } from "@/components/ui/FilterSidebar";

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 500);
  const [tagFilter, setTagFilter] = useState(null);

  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  // loadId changes every time a new first page is requested (query or tag
  // changed). A "View more" response is only appended if the search it
  // belongs to is still the current one, and the component is still mounted.
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
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (tagFilter) params.set("tag", tagFilter);
      params.set("page", page);
      return clientFetch(`/search/questions/?${params.toString()}`);
    },
    [debouncedQuery, tagFilter]
  );

  useEffect(() => {
    const id = ++loadId.current;
    setStatus("loading");
    setErrorMsg("");
    setLoadMoreError("");
    fetchPage(1)
      .then((data) => {
        if (id !== loadId.current) return;
        setResults(data.results);
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
      setResults((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (mounted.current && id === loadId.current) setLoadMoreError(err.message);
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }

  const activeCount = tagFilter ? 1 : 0;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Search</h1>

      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search questions across all schools..."
          loading={query !== debouncedQuery}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <FilterSidebar
          hasActiveFilters={activeCount > 0}
          activeCount={activeCount}
          onClear={() => setTagFilter(null)}
        >
          <FilterSection title="Tag">
            <SearchTagFilter value={tagFilter} onChange={setTagFilter} />
          </FilterSection>
        </FilterSidebar>

        <div>
          {status === "loading" && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {status === "error" && <ErrorMessage>Couldn't search: {errorMsg}</ErrorMessage>}

          {status === "ready" && results.length === 0 && (
            <EmptyState
              icon={Search}
              title="No questions found"
              description={
                debouncedQuery || tagFilter
                  ? `Nothing matches${debouncedQuery ? ` "${debouncedQuery}"` : ""}${
                      tagFilter ? ` tagged "${tagFilter}"` : ""
                    }. Try fewer or different words.`
                  : undefined
              }
            />
          )}

          {status === "ready" && results.length > 0 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {count} result{count !== 1 ? "s" : ""}
                {!debouncedQuery && " · sorted by relevance and activity"}
              </p>
              <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
                {results.map((q) => (
                  <QuestionListRow key={q.id} question={q} showSchool />
                ))}
              </div>
            </>
          )}

          {nextPage && status === "ready" && (
            <div className="mt-4 text-center">
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
      </div>
    </div>
  );
}

export default function SearchResultsClient() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <SearchResults />
    </Suspense>
  );
}