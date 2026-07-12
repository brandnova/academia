"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";
import Skeleton from "@/components/ui/Skeleton";

export default function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback((page) => clientFetch(`/users/me/comments/?page=${page}`), []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setComments(data.results);
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
      setComments((prev) => [...prev, ...data.results]);
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
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (status === "error") return <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>;
  if (comments.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>;
  }

  return (
    <div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
        {comments.map((c) => (
          <Link
            key={c.id}
            href={questionUrl(c.answer.question)}
            className="block py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <p className="text-xs text-gray-400 truncate">on {c.answer.question.title}</p>
            <p className="text-sm mt-0.5 truncate">{c.body}</p>
            <p className="text-xs text-gray-400 mt-1">{timeAgo(c.created_at)}</p>
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