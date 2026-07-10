"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";

export default function RequestHubModal({ schoolId, schoolName, onClose, onSuccess }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const request = await clientFetch("/hubs/activation-requests/", {
        method: "POST",
        body: JSON.stringify({ school_id: schoolId, notes: notes || undefined }),
      });
      onSuccess(request);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
          <p className="text-sm mb-4">You need to log in to request a hub activation.</p>
          <button onClick={onClose} className="text-sm text-accent hover:underline">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Request hub activation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Requesting a hub for <strong>{schoolName}</strong>. An admin will review
          this request before the hub goes live.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-4"
            placeholder="Why does this school need a hub?"
          />
          {status === "error" && (
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{errorMsg}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
            >
              {status === "loading" ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}