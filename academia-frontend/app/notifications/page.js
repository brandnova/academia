"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import Skeleton from "@/components/ui/Skeleton";
import NotificationItem from "@/components/notifications/NotificationItem";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState("all"); // all | unread
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (filter === "unread") params.set("is_read", "false");
      params.set("page", page);
      return clientFetch(`/notifications/?${params.toString()}`);
    },
    [filter]
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setNotifications(data.results);
        setUnreadCount(data.unread_count);
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
  }, [fetchPage, user]);

  async function handleLoadMore() {
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      setNotifications((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setLoadMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await clientFetch(`/notifications/${id}/mark-read/`, { method: "POST" });
    } catch {
      // best-effort
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await clientFetch("/notifications/mark-all-read/", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // best-effort
    } finally {
      setMarkingAll(false);
    }
  }

  if (authLoading) return <p className="text-gray-500">Loading...</p>;

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        You need to log in to view notifications.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              filter === f
                ? "border-accent text-accent"
                : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm">
          Couldn't load notifications: {errorMsg}
        </p>
      )}

      {status === "ready" && notifications.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {filter === "unread" ? "No unread notifications." : "No notifications yet."}
        </p>
      )}

      {status === "ready" && notifications.length > 0 && (
        <div className="border-y border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={handleRead} />
          ))}
        </div>
      )}

      {nextPage && status === "ready" && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "View more"}
          </button>
          {loadMoreError && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{loadMoreError}</p>
          )}
        </div>
      )}
    </div>
  );
}