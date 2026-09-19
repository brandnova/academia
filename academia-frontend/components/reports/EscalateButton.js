"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";

const REPORT_TYPES = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "DUPLICATE", label: "Duplicate" },
];

// Shared permission check, exported so parents can decide whether to show
// the menu item at all without duplicating this logic.
export function canEscalate(user, hubId) {
  if (!user) return false;
  if (user.is_admin) return true;
  if (!hubId) return false;
  const isMod = (user.moderator_for || []).some((m) => m.hub_id === hubId);
  const isRep = (user.representative_for || []).some((r) => r.hub_id === hubId);
  return isMod || isRep;
}

export default function EscalateButton({ contentType, contentId, open, onClose }) {
  const [type, setType] = useState("SPAM");
  const [description, setDescription] = useState("");
  // idle | loading | success | already_reported | error
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const report = await clientFetch("/reports/", {
        method: "POST",
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          type,
          description: description || undefined,
        }),
      });
      await clientFetch(`/reports/${report.id}/escalate/`, { method: "POST" });
      setStatus("success");
    } catch (err) {
      if (err.status === 400 && /already reported/i.test(err.message)) {
        setStatus("already_reported");
      } else {
        setStatus("error");
        setErrorMsg(err.message);
      }
    }
  }

  function close() {
    setStatus("idle");
    setDescription("");
    setType("SPAM");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full border-t-4 border-accent">
        {status === "success" ? (
          <div>
            <p className="text-sm mb-4">
              Escalated. Every admin has been notified for priority review.
            </p>
            <button onClick={close} className="text-sm text-accent hover:underline">
              Close
            </button>
          </div>
        ) : status === "already_reported" ? (
          <div>
            <p className="text-sm mb-4">
              You've already reported this content, so there's no pending
              report left to escalate through this action. An admin will
              need to review it directly from the reports dashboard.
            </p>
            <button onClick={close} className="text-sm text-accent hover:underline">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="font-semibold mb-1 flex items-center gap-1.5 text-accent">
              <ShieldAlert className="w-4 h-4" />
              Escalate this {contentType}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              This goes straight to every admin for priority review, not a
              routine report. Use it for content that needs a staff
              judgment call.
            </p>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reason</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-white dark:bg-gray-800 text-sm mb-3"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded border border-[var(--color-border)] bg-white dark:bg-gray-800 text-sm mb-3"
            />
            {status === "error" && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-3">{errorMsg}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="text-sm px-4 py-2 rounded border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
              >
                {status === "loading" ? "Escalating..." : "Escalate"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}