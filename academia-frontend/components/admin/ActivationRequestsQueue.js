"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Building2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/FormControls";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];
// The backend stores and emails the rejection reason, and caps it at 1000
// characters.
const REASON_MAX = 1000;

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
  const [rejectError, setRejectError] = useState("");
  const [query, setQuery] = useState("");

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

  // GET /hubs/activation-requests/ has no documented search param (only
  // status/page), so this filters the already-loaded page only, not the
  // full server-side dataset. Said explicitly in the UI below rather than
  // implying a fuller search than what's actually happening.
  const filteredRequests = useMemo(() => {
    if (!query) return requests;
    const q = query.toLowerCase();
    return requests.filter(
      (r) => r.school.name.toLowerCase().includes(q) || r.user.full_name.toLowerCase().includes(q)
    );
  }, [requests, query]);

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
    setRejectError("");
    try {
      await clientFetch(`/hubs/activation-requests/${id}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      // A 400 means the reason failed validation. The request stays pending,
      // so the message belongs next to the field, not in the list footer.
      if (err.status === 400) setRejectError(err.message);
      else setActionError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  function openReject(id) {
    setRejectingId(id);
    setRejectReason("");
    setRejectError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setRejectReason("");
    setRejectError("");
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
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

      {status === "ready" && requests.length > 0 && (
        <div className="mb-4">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by school or requester..." />
          <p className="text-xs text-gray-400 mt-1">
            Searches the {requests.length} request{requests.length !== 1 ? "s" : ""} loaded so far.
            {nextPage && " Load more below to search further."}
          </p>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {status === "error" && <ErrorMessage>{errorMsg}</ErrorMessage>}
      {status === "ready" && requests.length === 0 && (
        <EmptyState icon={Building2} title={`No ${statusFilter.toLowerCase()} requests`} />
      )}
      {status === "ready" && requests.length > 0 && filteredRequests.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No loaded requests match &quot;{query}&quot;.
        </p>
      )}

      {status === "ready" && filteredRequests.length > 0 && (
        <div className="space-y-2">
          {filteredRequests.map((req) => (
            <div key={req.id} className="border border-[var(--color-border)] rounded-lg p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{req.school.name}</span>
                <span className="text-xs text-gray-400">{timeAgo(req.created_at)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Requested by {req.user.full_name}
              </p>
              {req.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                  &quot;{req.notes}&quot;
                </p>
              )}
              {req.rejection_reason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                  <span className="font-medium">Reason:</span> {req.rejection_reason}
                </p>
              )}

              {statusFilter === "PENDING" && (
                <div className="mt-2">
                  {rejectingId === req.id ? (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          size="xs"
                          fullWidth={false}
                          className="flex-1 min-w-[140px]"
                          value={rejectReason}
                          onChange={(e) => {
                            setRejectReason(e.target.value);
                            if (rejectError) setRejectError("");
                          }}
                          maxLength={REASON_MAX}
                          placeholder="Reason (optional)"
                          aria-label="Rejection reason"
                          invalid={Boolean(rejectError)}
                        />
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actioningId === req.id}
                          className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                        >
                          {actioningId === req.id ? "Rejecting..." : "Confirm reject"}
                        </button>
                        <button onClick={cancelReject} className="text-xs text-gray-400">
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {REASON_MAX - rejectReason.length} characters left. The requester receives
                        this reason by email.
                      </p>
                      <ErrorMessage size="xs" className="mt-1">
                        {rejectError}
                      </ErrorMessage>
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
                        onClick={() => openReject(req.id)}
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
      <ErrorMessage size="xs" className="mt-2">
        {actionError}
      </ErrorMessage>
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