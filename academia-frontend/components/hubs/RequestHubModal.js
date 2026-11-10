"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField, Textarea } from "@/components/ui/FormControls";

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
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-modal">
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Request hub activation</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Requesting a hub for <strong>{schoolName}</strong>. An admin will review
          this request before the hub goes live.
        </p>
        <form onSubmit={handleSubmit}>
          <FormField label="Notes (optional)" className="mb-4">
            {(field) => (
              <Textarea
                {...field}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Why does this school need a hub?"
              />
            )}
          </FormField>
          <ErrorMessage className="mb-4">{status === "error" ? errorMsg : ""}</ErrorMessage>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)]"
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