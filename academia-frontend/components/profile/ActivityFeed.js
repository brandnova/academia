"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, MessageCircle, Reply } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";
import Skeleton from "@/components/ui/Skeleton";

export default function ActivityFeed({ userId }) {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [questions, answers, comments] = await Promise.all([
          clientFetch(`/questions/?author=${userId}&page_size=5&ordering=-created_at`),
          clientFetch(`/users/me/answers/?page_size=5`),
          clientFetch(`/users/me/comments/?page_size=5`),
        ]);

        const merged = [
          ...questions.results.map((q) => ({ type: "question", date: q.created_at, question: q })),
          ...answers.results.map((a) => ({ type: "answer", date: a.created_at, answer: a })),
          ...comments.results.map((c) => ({ type: "comment", date: c.created_at, comment: c })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (!cancelled) {
          setItems(merged.slice(0, 8));
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">Couldn't load recent activity.</p>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity.</p>;
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)] stagger-list">
      {items.map((item) => {
        if (item.type === "question") {
          return (
            <Link
              key={`q-${item.question.id}`}
              href={questionUrl(item.question)}
              className="flex items-center gap-2 py-2.5 px-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <MessageSquare className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate flex-1">Asked: {item.question.title}</span>
              <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.date)}</span>
            </Link>
          );
        }
        if (item.type === "answer") {
          return (
            <Link
              key={`a-${item.answer.id}`}
              href={questionUrl(item.answer.question)}
              className="flex items-center gap-2 py-2.5 px-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <Reply className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate flex-1">Answered: {item.answer.question.title}</span>
              <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.date)}</span>
            </Link>
          );
        }
        return (
          <Link
            key={`c-${item.comment.id}`}
            href={questionUrl(item.comment.answer.question)}
            className="flex items-center gap-2 py-2.5 px-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <MessageCircle className="w-4 h-4 text-accent shrink-0" />
            <span className="truncate flex-1">
              Commented on: {item.comment.answer.question.title}
            </span>
            <span className="text-xs text-gray-400 shrink-0">{timeAgo(item.date)}</span>
          </Link>
        );
      })}
    </div>
  );
}