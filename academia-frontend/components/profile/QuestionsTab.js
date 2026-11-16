"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import QuestionListRow from "@/components/questions/QuestionListRow";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function QuestionsTab({ userId }) {
  const [questions, setQuestions] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const fetchPage = useCallback(
    (page) => clientFetch(`/questions/?author=${userId}&page=${page}`),
    [userId]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.results);
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

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (status === "error") return <ErrorMessage>{errorMsg}</ErrorMessage>;
  if (questions.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No questions yet"
        description="Questions you ask will show up here."
      />
    );
  }

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
        {questions.map((q) => (
          <QuestionListRow key={q.id} question={q} showSchool />
        ))}
      </div>
      {nextPage && (
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