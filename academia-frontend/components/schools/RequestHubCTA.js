"use client";

import { useState } from "react";
import RequestHubModal from "@/components/hubs/RequestHubModal";

export default function RequestHubCTA({ schoolId, schoolName }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
        <p className="font-medium mb-1">Request submitted.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          An admin will review your request for {schoolName}.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
      <p className="font-medium mb-1">{schoolName} doesn't have an active hub yet.</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Be the first to request one.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-4 py-2 rounded bg-accent text-white"
      >
        Request hub activation
      </button>
      {open && (
        <RequestHubModal
          schoolId={schoolId}
          schoolName={schoolName}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setSubmitted(true);
          }}
        />
      )}
    </div>
  );
}