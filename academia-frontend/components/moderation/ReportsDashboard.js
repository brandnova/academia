"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import { timeAgo } from "@/lib/timeAgo";

const STATUS_TABS = ["PENDING", "RESOLVED", "REJECTED"];
const TYPE_LABELS = {
  SPAM: "Spam",
  ABUSE: "Abuse",
  MISINFORMATION: "Misinformation",
  DUPLICATE: "Duplicate",
};

export default function ReportsDashboard() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", page);
      return clientFetch(`/reports/?${params.toString()}`);
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
        setReports(data.results);
        setCount(data.count);
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
      setReports((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleResolve(reportId, deleteContent) {
    setActioningId(reportId);
    setActionError("");
    try {
      await clientFetch(`/reports/${reportId}/resolve/`, {
        method: "POST",
        body: JSON.stringify(deleteContent ? { action: "DELETE_CONTENT" } : {}),
      });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(reportId) {
    setActioningId(reportId);
    setActionError("");
    try {
      await clientFetch(`/reports/${reportId}/reject/`, { method: "POST" });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setCount((prev) => Math.max(prev - 1, 0));
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
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm">
          Couldn't load reports: {errorMsg}
        </p>
      )}

      {status === "ready" && reports.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No {statusFilter.toLowerCase()} reports.
        </p>
      )}

      {status === "ready" && reports.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {count} report{count !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="border border-[var(--color-border)] rounded-lg p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-medium">{TYPE_LABELS[report.type] || report.type}</span>
                  <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {report.content_type === "question" ? (
                    <Link
                      href={`/questions/${report.content_id}`}
                      className="text-accent hover:underline"
                    >
                      View reported question
                    </Link>
                  ) : (
                    `Reported ${report.content_type} (${report.content_id})`
                  )}
                </p>
                {report.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    &quot;{report.description}&quot;
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-2">
                  Reported by {report.reporter?.full_name}
                </p>

                {statusFilter === "PENDING" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleResolve(report.id, false)}
                      disabled={actioningId === report.id}
                      className="text-xs px-3 py-1 rounded border border-[var(--color-border)] disabled:opacity-50"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, true)}
                      disabled={actioningId === report.id}
                      className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                    >
                      Resolve &amp; delete content
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      disabled={actioningId === report.id}
                      className="text-xs px-3 py-1 rounded border border-[var(--color-border)] disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {actionError && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-2">{actionError}</p>
          )}
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
        </>
      )}
    </div>
  );
}