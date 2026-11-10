// app/hubs/[id]/error.js
"use client";

export default function HubError({ error, reset }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600 dark:text-red-400 mb-4">
        Something went wrong loading this hub: {error.message}
      </p>
      <button
        onClick={reset}
        className="text-sm px-4 py-2 rounded border border-[var(--color-border-strong)]"
      >
        Try again
      </button>
    </div>
  );
}