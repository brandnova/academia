"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";
import SchoolFormModal from "./SchoolFormModal";
import SchoolAdminRow from "./SchoolAdminRow";

export default function SchoolsManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [schools, setSchools] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      params.set("page", page);
      return clientFetch(`/schools/?${params.toString()}`);
    },
    [debouncedQuery]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setSchools(data.results);
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
    try {
      const data = await fetchPage(nextPage);
      setSchools((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleCreated(school) {
    setSchools((prev) => [school, ...prev]);
    setShowCreate(false);
  }

  function handleUpdated(updated) {
    setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded bg-accent text-white whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New school
        </button>
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
      {status === "ready" && schools.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No schools found.</p>
      )}
      {status === "ready" && schools.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
          {schools.map((school) => (
            <SchoolAdminRow key={school.id} school={school} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
      {nextPage && (
        <div className="mt-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "View more"}
          </button>
        </div>
      )}

      {showCreate && <SchoolFormModal onClose={() => setShowCreate(false)} onSaved={handleCreated} />}
    </div>
  );
}