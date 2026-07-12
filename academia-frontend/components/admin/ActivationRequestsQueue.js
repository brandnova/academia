"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/timeAgo";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function ActivationRequestsQueue() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", page);
      return clientFetch(`/hubs/activation-requests/?${params.toString()}`);
    },
    [statusFilter]
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setRequests(data.results);
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
      setRequests((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleApprove(id) {
    setActioningId(id);
    setActionError("");
    try {
      await clientFetch(`/hubs/activation-requests/${id}/approve/`, { method: "POST" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id) {
    setActioningId(id);
    setActionError("");
    try {
      await clientFetch(`/hubs/activation-requests/${id}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1 rounded border ${
              statusFilter === s
                ? "border-accent text-accent"
                : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
      {status === "ready" && requests.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No {statusFilter.toLowerCase()} requests.
        </p>
      )}

      {status === "ready" && requests.length > 0 && (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="border border-[var(--color-border)] rounded-lg p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{req.school.name}</span>
                <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Requested by {req.user.full_name}
              </p>
              {req.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  &quot;{req.notes}&quot;
                </p>
              )}

              {statusFilter === "PENDING" && (
                <div className="mt-2">
                  {rejectingId === req.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 min-w-[140px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"
                      />
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={actioningId === req.id}
                        className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                      >
                        Confirm reject
                      </button>
                      <button onClick={() => setRejectingId(null)} className="text-xs text-gray-400">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actioningId === req.id}
                        className="text-xs px-3 py-1 rounded bg-accent text-white disabled:opacity-50"
                      >
                        {actioningId === req.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="text-xs px-3 py-1 rounded border border-[var(--color-border)]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
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