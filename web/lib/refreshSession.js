// Server side only. Rotates the JWT pair once per refresh token, however many
// requests ask at the same moment.
//
// Why: the backend blacklists a refresh token the first time it is used. A
// page load fires several requests at once, and when the access token has
// expired each of them used to call /auth/refresh/ with the same refresh
// token. The first one won, the rest got a 401 and cleared the cookies,
// which logged the user out.
//
// How: concurrent callers share one in-flight promise, and the settled result
// is kept for a short grace window, so a request that was already on its way
// with the old token still receives the new pair instead of trying again.
//
// Limit: this memory lives inside one server instance. On serverless, two
// instances can still race each other.

const API_URL = process.env.BACKEND_API_URL;
const GRACE_MS = 10_000;
const REFRESH_TIMEOUT_MS = 8_000;

const entries = new Map(); // refresh token -> { promise, settledAt }

// Never rejects. Returns one of:
//   { kind: "ok", access, refresh }  the pair was rotated
//   { kind: "invalid" }              the backend says this refresh token is dead
//   { kind: "unavailable" }          network failure, timeout, 429 or 5xx
// Only "invalid" may log the user out. A backend that is slow or busy must
// not end a valid session.
async function requestRefresh(refreshToken) {
  let res;
  try {
    res = await fetch(`${API_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
      // A hung request would otherwise hold every waiter on the shared promise.
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
  } catch {
    return { kind: "unavailable" };
  }

  if (res.status === 400 || res.status === 401) return { kind: "invalid" };
  if (!res.ok) return { kind: "unavailable" };

  try {
    const data = await res.json();
    if (!data?.access || !data?.refresh) return { kind: "unavailable" };
    return { kind: "ok", access: data.access, refresh: data.refresh };
  } catch {
    return { kind: "unavailable" };
  }
}

function sweep(now) {
  for (const [token, entry] of entries) {
    if (entry.settledAt && now - entry.settledAt > GRACE_MS) entries.delete(token);
  }
}

export function refreshSession(refreshToken) {
  sweep(Date.now());

  const existing = entries.get(refreshToken);
  if (existing) return existing.promise;

  const entry = { settledAt: null, promise: null };
  entry.promise = requestRefresh(refreshToken).then((result) => {
    if (result.kind === "unavailable") {
      // Transient, let the next request try again.
      entries.delete(refreshToken);
    } else {
      entry.settledAt = Date.now();
    }
    return result;
  });
  entries.set(refreshToken, entry);
  return entry.promise;
}