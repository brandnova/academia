"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function CommentsTab() {
  const [comments, setComments] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

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
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      setComments((prev) => [...prev, ...data.results]);
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
  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No comments yet"
        description="Comments you write will show up here."
      />
    );
  }

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
        {comments.map((c) => (
          <Link
            key={c.id}
            href={questionUrl(c.answer.question)}
            className="block py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <p className="text-xs text-muted truncate">on {c.answer.question.title}</p>
            <p className="text-sm mt-0.5 truncate">{c.body}</p>
            <p className="text-xs text-muted mt-1">{timeAgo(c.created_at)}</p>
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