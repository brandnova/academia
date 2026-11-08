"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Flag, ShieldAlert, X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { linkTargetUrl } from "@/lib/linkTarget";
import { REPORT_TYPE_LABELS } from "@/lib/reportLabels";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Select } from "@/components/ui/FormControls";
import Skeleton from "@/components/ui/Skeleton";

const STATUS_TABS = ["PENDING", "RESOLVED", "REJECTED"];
const CONTENT_TYPE_OPTIONS = [
  { value: "", label: "All content" },
  { value: "question", label: "Questions" },
  { value: "answer", label: "Answers" },
  { value: "comment", label: "Comments" },
];

export default function ReportsDashboard() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [contentType, setContentType] = useState("");
  const [escalatedOnly, setEscalatedOnly] = useState(false);

  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const [actioningId, setActioningId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  // Bumped on every list load. A response only lands if no newer load has
  // started since, so a slow request from an old filter can never overwrite
  // the current one.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (contentType) params.set("content_type", contentType);
      if (escalatedOnly) params.set("is_escalated", "true");
      params.set("page", page);
      return clientFetch(`/reports/?${params.toString()}`);
    },
    [statusFilter, contentType, escalatedOnly]
  );

  const loadFirstPage = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestId.current;
      if (!silent) {
        setStatus("loading");
        setErrorMsg("");
      }
      try {
        const data = await fetchPage(1);
        if (id !== requestId.current) return;
        setReports(data.results);
        setCount(data.count);
        setNextPage(data.next ? 2 : null);
        setStatus("ready");
      } catch (err) {
        if (id !== requestId.current) return;
        if (silent) {
          // A background refresh failed, keep the list the admin is looking at.
          setActionError(err.message);
          return;
        }
        setErrorMsg(err.message);
        setStatus("error");
      }
    },
    [fetchPage]
  );

  useEffect(() => {
    setNotice("");
    setActionError("");
    setConfirmDeleteId(null);
    loadFirstPage();
  }, [loadFirstPage]);

  async function handleLoadMore() {
    const id = requestId.current;
    setLoadingMore(true);
    setActionError("");
    try {
      const data = await fetchPage(nextPage);
      if (id !== requestId.current) return;
      setReports((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (id === requestId.current) setActionError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleResolve(reportId, deleteContent) {
    setActioningId(reportId);
    setActionError("");
    setNotice("");
    try {
      const result = await clientFetch(`/reports/${reportId}/resolve/`, {
        method: "POST",
        body: JSON.stringify(deleteContent ? { action: "DELETE_CONTENT" } : {}),
      });
      const alsoClosed = deleteContent ? result?.auto_resolved_count ?? 0 : 0;
      if (alsoClosed > 0) {
        setNotice(
          `${alsoClosed} other report${alsoClosed !== 1 ? "s" : ""} on this content ${
            alsoClosed !== 1 ? "were" : "was"
          } also closed.`
        );
        // Other rows changed status too, so refetch instead of patching locally.
        await loadFirstPage({ silent: true });
      } else {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActioningId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleReject(reportId) {
    setActioningId(reportId);
    setActionError("");
    setNotice("");
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

  const emptyTitle = `No ${[escalatedOnly && "escalated", statusFilter.toLowerCase(), contentType]
    .filter(Boolean)
    .join(" ")} reports`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-2">
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

        <Select
          size="xs"
          fullWidth={false}
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          aria-label="Filter by content type"
        >
          {CONTENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <button
          onClick={() => setEscalatedOnly((v) => !v)}
          aria-pressed={escalatedOnly}
          className={`flex items-center gap-1 text-xs px-3 py-1 rounded border sm:ml-auto ${
            escalatedOnly
              ? "border-accent bg-accent/10 text-accent"
              : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Escalated only
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-2 mb-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs"
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notice"
            className="shrink-0 text-gray-400 hover:text-accent"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {status === "error" && <ErrorMessage>Couldn't load reports: {errorMsg}</ErrorMessage>}

      {status === "ready" && reports.length === 0 && (
        <EmptyState icon={Flag} title={emptyTitle} description="Nothing to review in this view." />
      )}

      {status === "ready" && reports.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {count} report{count !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {reports.map((report) => {
              const removed = report.content_exists === false;
              const contentUrl = removed ? null : linkTargetUrl(report.link_target);
              const busy = actioningId === report.id;

              return (
                <div
                  key={report.id}
                  className={`border rounded-lg p-3 text-sm ${
                    report.is_escalated
                      ? "border-accent bg-accent/5"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  {report.is_escalated && (
                    <p className="flex items-center gap-1 text-xs text-accent font-medium mb-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Escalated{report.escalated_by ? ` by ${report.escalated_by.full_name}` : ""}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-medium">
                      {REPORT_TYPE_LABELS[report.type] || report.type}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(report.created_at)}</span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {removed ? (
                      <span className="italic text-gray-400">Content removed</span>
                    ) : contentUrl ? (
                      <Link href={contentUrl} className="text-accent hover:underline">
                        View reported {report.content_type}
                      </Link>
                    ) : (
                      `Reported ${report.content_type}`
                    )}
                  </p>

                  {report.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 break-words">
                      &quot;{report.description}&quot;
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">
                    Reported by {report.reporter?.full_name}
                  </p>

                  {statusFilter === "PENDING" &&
                    (confirmDeleteId === report.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="w-full text-xs text-gray-500 dark:text-gray-400">
                          This permanently deletes the content and anything inside it, and closes
                          the related reports.
                        </p>
                        <button
                          onClick={() => handleResolve(report.id, true)}
                          disabled={busy}
                          className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                        >
                          {busy ? "Deleting..." : "Confirm delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                          className="text-xs text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleResolve(report.id, false)}
                          disabled={busy}
                          className="text-xs px-3 py-1 rounded border border-[var(--color-border)] disabled:opacity-50"
                        >
                          Resolve
                        </button>
                        {!removed && (
                          <button
                            onClick={() => setConfirmDeleteId(report.id)}
                            disabled={busy}
                            className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                          >
                            Resolve &amp; delete content
                          </button>
                        )}
                        <button
                          onClick={() => handleReject(report.id)}
                          disabled={busy}
                          className="text-xs px-3 py-1 rounded border border-[var(--color-border)] disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          <ErrorMessage size="xs" className="mt-2">
            {actionError}
          </ErrorMessage>

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
        </>
      )}
    </div>
  );
}