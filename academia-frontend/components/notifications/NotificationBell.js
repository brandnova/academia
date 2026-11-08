"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Skeleton from "@/components/ui/Skeleton";
import NotificationItem from "./NotificationItem";

const DROPDOWN_LIMIT = 6;
const COUNT_REFETCH_MIN_MS = 10_000;

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [markingAll, setMarkingAll] = useState(false);

  const listRequestId = useRef(0);
  const lastCountFetch = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    lastCountFetch.current = Date.now();
    try {
      const data = await clientFetch("/notifications/?page_size=1");
      setUnreadCount(data.unread_count);
    } catch {
      // non-critical, badge just stays at its last known value
    }
  }, []);

  // Badge: fetch on mount, then again whenever the window or tab comes back
  // into view. No polling.
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    function refreshIfStale() {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastCountFetch.current < COUNT_REFETCH_MIN_MS) return;
      fetchUnreadCount();
    }

    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [user, fetchUnreadCount]);

  const loadList = useCallback(async () => {
    const requestId = ++listRequestId.current;
    try {
      const data = await clientFetch(`/notifications/?page_size=${DROPDOWN_LIMIT}`);
      if (requestId !== listRequestId.current) return; // a newer open superseded this one
      lastCountFetch.current = Date.now();
      setNotifications(data.results);
      setUnreadCount(data.unread_count);
      setStatus("ready");
    } catch {
      if (requestId !== listRequestId.current) return;
      // A failed background refresh keeps the list the user already sees.
      setStatus((prev) => (prev === "ready" ? prev : "error"));
    }
  }, []);

  function handleToggle(wasOpen, toggle) {
    toggle();
    if (wasOpen) return;
    // First open (or a retry after an error) shows the skeleton, later opens
    // keep the old list on screen and refresh it in place.
    setStatus((prev) => (prev === "ready" ? prev : "loading"));
    loadList();
  }

  async function handleRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    try {
      await clientFetch(`/notifications/${id}/mark-read/`, { method: "POST" });
    } catch {
      // best-effort; local state already reflects the intent
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

  if (!user) return null;

  return (
    <Dropdown
      panelClassName="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-80 flex flex-col max-h-[70vh] overflow-hidden"
      trigger={({ open, toggle }) => (
        <button
          onClick={() => handleToggle(open, toggle)}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          aria-expanded={open}
          aria-haspopup="true"
          className="relative p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--color-border)]">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs text-accent hover:underline disabled:opacity-50"
              >
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>
            )}
          </div>

          {/* Four compact rows (4 x 4.875rem = 19.5rem) show at once, the rest
              scroll. The footer lives outside this region so it never moves. */}
          <div
            className="min-w-0 flex-1 max-h-[19.5rem] overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-border-strong) transparent" }}
          >
            {status === "loading" && (
              <div className="p-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}

            {status === "error" && (
              <div className="px-3 py-5 text-center">
                <ErrorMessage>Couldn't load notifications.</ErrorMessage>
                <button
                  onClick={() => {
                    setStatus("loading");
                    loadList();
                  }}
                  className="text-xs text-accent hover:underline mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {status === "ready" && notifications.length === 0 && (
              <EmptyState
                variant="inline"
                icon={Bell}
                title="You're all caught up"
                description="New activity will show up here."
              />
            )}

            {status === "ready" &&
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onNavigate={close}
                  compact
                />
              ))}
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)]">
            <Link
              href="/notifications"
              onClick={close}
              className="block text-center text-xs text-accent py-2.5 hover:underline"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </Dropdown>
  );
}