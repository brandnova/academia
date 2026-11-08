"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Skeleton from "@/components/ui/Skeleton";
import QuestionListRow from "@/components/questions/QuestionListRow";

export default function RecentQuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  // Same guard the initial fetch effect uses with its cancelled flag: a
  // load-more response that lands after the user navigated away is dropped.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    (page) => clientFetch(`/questions/?ordering=-created_at&page=${page}`),
    []
  );

  useEffect(() => {
    let cancelled = false;
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
      if (!mounted.current) return;
      setQuestions((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (mounted.current) setLoadMoreError(err.message);
    } finally {
      if (mounted.current) setLoadingMore(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (status === "error") {
    return <ErrorMessage>Couldn't load questions: {errorMsg}</ErrorMessage>;
  }
  if (questions.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No questions yet"
        description="Be the first to ask one."
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
  );
}