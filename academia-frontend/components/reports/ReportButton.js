"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

const REPORT_TYPES = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "DUPLICATE", label: "Duplicate" },
];

export default function ReportButton({ contentType, contentId, authorId }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("SPAM");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!user || user.id === authorId) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch("/reports/", {
        method: "POST",
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          type,
          description: description || undefined,
        }),
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-gray-400 hover:text-red-500"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            {status === "success" ? (
              <div>
                <p className="text-sm mb-4">Thanks, this has been reported for review.</p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setStatus("idle");
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="font-semibold mb-4">Report this {contentType}</h2>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Reason
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-3"
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
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-3"
                />
                {status === "error" && (
                  <p className="text-red-600 dark:text-red-400 text-sm mb-3">{errorMsg}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
                  >
                    {status === "loading" ? "Submitting..." : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}