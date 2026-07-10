"use client";

export default function SchoolError({ error, reset }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600 dark:text-red-400 mb-4">
        Something went wrong loading this school: {error.message}
      </p>
      <button
        onClick={reset}
        className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600"
      >
        Try again
      </button>
    </div>
  );
}