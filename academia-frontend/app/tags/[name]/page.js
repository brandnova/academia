"use client";

import { use, useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import QuestionListRow from "@/components/questions/QuestionListRow";
import FilterSidebar, { FilterSection } from "@/components/ui/FilterSidebar";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ANSWERED", label: "Answered" },
  { value: "SOLVED", label: "Solved" },
];

export default function TagQuestionsPage({ params }) {
  const { name } = use(params);
  const tagName = decodeURIComponent(name);

  const [statusFilter, setStatusFilter] = useState("");
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
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page);
      return clientFetch(`/tags/${encodeURIComponent(tagName)}/questions/?${params.toString()}`);
    },
    [tagName, statusFilter]
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

  return (
    <div>
      <p className="text-sm mb-2">
        <Link href="/tags" className="text-accent hover:underline">
          <ArrowLeft className="w-4 h-4" /> All tags
        </Link>
      </p>
      <h1 className="text-xl font-semibold mb-6">
        Questions tagged <span className="text-accent">{tagName}</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <FilterSidebar hasActiveFilters={Boolean(statusFilter)} onClear={() => setStatusFilter("")}>
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
        </FilterSidebar>

        <div>
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
              No questions tagged "{tagName}" yet{statusFilter ? " with this status" : ""}.
            </p>
          )}

          {status === "ready" && questions.length > 0 && (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {count} question{count !== 1 ? "s" : ""}
              </p>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
                {questions.map((q) => (
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
    </div>
  );
}