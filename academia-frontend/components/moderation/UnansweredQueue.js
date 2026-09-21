"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import Skeleton from "@/components/ui/Skeleton";
import SearchBar from "@/components/ui/SearchBar";
import QuestionListRow from "@/components/questions/QuestionListRow";

export default function UnansweredQueue({ hubId, showSchool = false }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (hubId) params.set("hub", hubId);
      if (debouncedQuery) params.set("search", debouncedQuery);
      params.set("page", page);
      return clientFetch(`/questions/unanswered/?${params.toString()}`);
    },
    [hubId, debouncedQuery]
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
    try {
      const data = await fetchPage(nextPage);
      setQuestions((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search unanswered questions..."
          loading={query !== debouncedQuery}
        />
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm">
          Couldn't load queue: {errorMsg}
        </p>
      )}

      {status === "ready" && questions.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {debouncedQuery
            ? `No unanswered questions match "${debouncedQuery}".`
            : "No unanswered questions right now."}
        </p>
      )}

      {status === "ready" && questions.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{count} unanswered</p>
          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
            {questions.map((q) => (
              <QuestionListRow key={q.id} question={q} showSchool={showSchool} />
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
        </div>
      )}
    </div>
  );
}