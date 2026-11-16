import { cookies } from "next/headers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Server Component only (never imported by a "use client" file). Forwards the
// incoming request's cookies to our own /api/backend proxy, otherwise every
// Server Component fetch is silently anonymous, since a server-side fetch()
// never inherits the browser's cookie jar on its own.
export async function apiFetch(path, options = {}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${SITE_URL}/api/backend${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...options.headers,
    },
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