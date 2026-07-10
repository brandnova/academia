import { apiFetch } from "@/lib/api";

export default async function HomePage() {
  let health = null;
  let error = null;

  try {
    health = await apiFetch("/health/");
  } catch (err) {
    error = err.message;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Academia</h1>
      {error ? (
        <p className="text-red-600 dark:text-red-400">
          Backend unreachable: <span className="font-mono">{error}</span>
        </p>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>Status: <span className="font-mono">{health.status}</span></p>
          <p>Database: <span className="font-mono">{health.checks.database}</span></p>
          <p>Cache: <span className="font-mono">{health.checks.cache}</span></p>
        </div>
      )}
    </div>
  );
}