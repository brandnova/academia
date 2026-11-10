"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Flag, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import { linkTargetUrl } from "@/lib/linkTarget";
import { REPORT_TYPE_LABELS } from "@/lib/reportLabels";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Skeleton from "@/components/ui/Skeleton";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "RESOLVED", label: "Reviewed" },
  { value: "REJECTED", label: "No action taken" },
];

// RESOLVED does not always mean content was removed, so the copy never says
// that. The API's content_exists flag tells that story separately.
const STATUS_DISPLAY = {
  PENDING: { label: "Awaiting review", icon: Clock },
  RESOLVED: { label: "Reviewed", icon: CheckCircle2 },
  REJECTED: { label: "No action taken", icon: XCircle },
};

export default function MyReportsClient() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [reports, setReports] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page) => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page);
      return clientFetch(`/reports/mine/?${params.toString()}`);
    },
    [statusFilter]
  );

  useEffect(() => {
    if (!user) return;
    const id = ++requestId.current;
    setStatus("loading");
    setErrorMsg("");
    fetchPage(1)
      .then((data) => {
        if (id !== requestId.current) return;
        setReports(data.results);
        setNextPage(data.next ? 2 : null);
        setStatus("ready");
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [fetchPage, user]);

  async function handleLoadMore() {
    const id = requestId.current;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const data = await fetchPage(nextPage);
      if (id !== requestId.current) return;
      setReports((prev) => [...prev, ...data.results]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (err) {
      if (id === requestId.current) setLoadMoreError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  if (authLoading) return <p className="text-gray-500">Loading...</p>;

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400">You need to log in to view your reports.</p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">My reports</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Only you can see this list. Reports never appear on your profile.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setStatusFilter(f.value)}
            aria-pressed={statusFilter === f.value}
            className={`text-sm px-3 py-1.5 rounded border ${
              statusFilter === f.value
                ? "border-accent text-accent"
                : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {status === "error" && <ErrorMessage>Couldn't load your reports: {errorMsg}</ErrorMessage>}

      {status === "ready" && reports.length === 0 && (
        <EmptyState
          icon={Flag}
          title={statusFilter ? "No reports in this view" : "You haven't reported anything"}
          description={
            statusFilter
              ? "Try a different status."
              : "If something doesn't belong here, use Report on any question, answer or comment."
          }
        />
      )}

      {status === "ready" && reports.length > 0 && (
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] stagger-list">
          {reports.map((report) => {
            const display = STATUS_DISPLAY[report.status] || STATUS_DISPLAY.PENDING;
            const StatusIcon = display.icon;
            const contentUrl = report.content_exists === false ? null : linkTargetUrl(report.link_target);

            return (
              <li key={report.id} className="py-3 px-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {REPORT_TYPE_LABELS[report.type] || report.type}
                    <span className="font-normal text-gray-400"> on a {report.content_type}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <StatusIcon className="w-3.5 h-3.5" />
                    {display.label}
                  </span>
                </div>

                {report.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                    &quot;{report.description}&quot;
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                  <span>Reported {timeAgo(report.created_at)}</span>
                  {report.resolved_at && <span>Reviewed {timeAgo(report.resolved_at)}</span>}
                  {contentUrl ? (
                    <Link href={contentUrl} className="text-accent hover:underline">
                      View {report.content_type}
                    </Link>
                  ) : (
                    <span className="italic">Content removed</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {nextPage && status === "ready" && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)] disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "View more"}
          </button>
          <ErrorMessage className="mt-2">{loadMoreError}</ErrorMessage>
        </div>
      )}
    </div>
  );
}