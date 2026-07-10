export default function RequestHubCTA({ schoolName }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
      <p className="font-medium mb-1">{schoolName} doesn't have an active hub yet.</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Hub activation requests are wired in Phase 4.
      </p>
      <button
        disabled
        className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed"
      >
        Request hub activation
      </button>
    </div>
  );
}