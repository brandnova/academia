"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

const FILTER_TABS = [
  { key: "", label: "All" },
  { key: "true", label: "Active" },
  { key: "false", label: "Suspended" },
];

export default function UsersManager() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [activeFilter, setActiveFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("search", debouncedQuery);
      if (activeFilter) params.set("is_active", activeFilter);
      params.set("page", page);
      return clientFetch(`/admin/users/?${params.toString()}`);
    },
    [debouncedQuery, activeFilter]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setUsers(data.results);
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
    try {
      const data = await fetchPage(nextPage);
      setUsers((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function toggleSuspend(u) {
    setActioningId(u.id);
    setActionError("");
    try {
      const updated = await clientFetch(`/admin/users/${u.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      setUsers((prev) => prev.map((usr) => (usr.id === updated.id ? updated : usr)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <div className="mb-3">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search users by name or email..."
          loading={query !== debouncedQuery}
        />
      </div>
      <div className="flex gap-2 mb-4">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveFilter(t.key)}
            className={`text-xs px-3 py-1 rounded border ${
              activeFilter === t.key
                ? "border-accent text-accent"
                : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
      {status === "ready" && users.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
      )}
      {status === "ready" && users.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2.5 px-2 text-sm">
              <div className="min-w-0">
                <p className={`truncate ${!u.is_active ? "text-gray-400 line-through" : ""}`}>
                  {u.full_name} {u.is_admin && <span className="text-xs text-accent">(admin)</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => toggleSuspend(u)}
                disabled={actioningId === u.id || u.id === currentUser?.id}
                className="text-xs px-3 py-1 rounded border border-[var(--color-border)] disabled:opacity-50 shrink-0"
                title={u.id === currentUser?.id ? "You can't suspend your own account" : undefined}
              >
                {actioningId === u.id ? "Saving..." : u.is_active ? "Suspend" : "Reactivate"}
              </button>
            </div>
          ))}
        </div>
      )}
      {actionError && <p className="text-red-600 dark:text-red-400 text-xs mt-2">{actionError}</p>}
      {nextPage && (
        <div className="mt-3 text-center">
          <button
            onClick={handleLoadMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border)]"
          >
            View more
          </button>
        </div>
      )}
    </div>
  );
}