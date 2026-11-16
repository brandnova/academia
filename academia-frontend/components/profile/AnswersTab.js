"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, Reply } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";
import Skeleton from "@/components/ui/Skeleton";
import { stripMarkdown } from "@/lib/markdown";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function AnswersTab() {
  const [answers, setAnswers] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const fetchPage = useCallback((page) => clientFetch(`/users/me/answers/?page=${page}`), []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setAnswers(data.results);
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
      setAnswers((prev) => [...prev, ...data.results]);
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
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (status === "error") return <ErrorMessage>{errorMsg}</ErrorMessage>;
  if (answers.length === 0) {
    return (
      <EmptyState
        icon={Reply}
        title="No answers yet"
        description="Answers you write will show up here."
      />
    );
  }

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
        {answers.map((a) => (
          <Link
            key={a.id}
            href={questionUrl(a.question)}
            className="block py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {a.is_best && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
              <span className="truncate">{a.question.title}</span>
            </div>
            <p className="text-sm text-muted truncate mt-0.5">{stripMarkdown(a.body)}</p>
            <div className="flex gap-3 text-xs text-muted mt-1">
              <span>{a.vote_score} votes</span>
              <span>{timeAgo(a.created_at)}</span>
            </div>
          </Link>
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