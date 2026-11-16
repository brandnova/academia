"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField, Select, Textarea } from "@/components/ui/FormControls";

const REPORT_TYPES = [
  { value: "SPAM", label: "Spam" },
  { value: "ABUSE", label: "Abuse" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "DUPLICATE", label: "Duplicate" },
];

export default function ReportButton({ contentType, contentId, open, onClose }) {
  const [type, setType] = useState("SPAM");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

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

  function close() {
    setStatus("idle");
    setDescription("");
    setType("SPAM");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        {status === "success" ? (
          <div>
            <p className="text-sm mb-4">Thanks, this has been reported for review.</p>
            <button onClick={close} className="text-sm text-accent hover:underline">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="font-semibold mb-4">Report this {contentType}</h2>
            <FormField label="Reason" className="mb-3">
              {(field) => (
                <Select {...field} value={type} onChange={(e) => setType(e.target.value)}>
                  {REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
            <FormField label="Details (optional)" className="mb-3">
              {(field) => (
                <Textarea
                  {...field}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              )}
            </FormField>
            <ErrorMessage className="mb-3">{status === "error" ? errorMsg : ""}</ErrorMessage>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)]"
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
  );
}