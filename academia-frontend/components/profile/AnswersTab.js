"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";
import Skeleton from "@/components/ui/Skeleton";

export default function AnswersTab() {
  const [answers, setAnswers] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

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
    try {
      const data = await fetchPage(nextPage);
      setAnswers((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setErrorMsg(err.message);
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
  if (status === "error") return <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>;
  if (answers.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No answers submitted yet.</p>;
  }

  return (
    <div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{a.body}</p>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
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
        </div>
      )}
    </div>
  );
}