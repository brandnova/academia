"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("idle");
  const ref = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await clientFetch("/notifications/?page_size=1");
      setUnreadCount(data.unread_count);
    } catch {
      // non-critical, badge just stays at its last known value
    }
  }, []);

  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") {
      setStatus("loading");
      try {
        const data = await clientFetch("/notifications/?page_size=8");
        setNotifications(data.results);
        setUnreadCount(data.unread_count);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }
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

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-80 bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded-lg shadow-lg max-h-[70vh] overflow-auto z-50">
          {status === "loading" && (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">Loading...</p>
          )}
          {status === "error" && (
            <p className="px-3 py-4 text-sm text-red-600 dark:text-red-400 text-center">
              Couldn't load notifications.
            </p>
          )}
          {status === "ready" && notifications.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">No notifications yet.</p>
          )}
          {status === "ready" &&
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={handleRead}
                onNavigate={() => setOpen(false)}
              />
            ))}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-accent py-2 border-t border-[var(--color-border)] hover:underline"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}