const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
  const base = typeof window === "undefined" ? SITE_URL : "";
  const res = await fetch(`${base}/api/backend${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: options.cache ?? "no-store",
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return data;
}