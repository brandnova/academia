"use client";

export const FRIENDLY_MESSAGES = {
  network: "Can't reach the server. Check your connection and try again.",
  rateLimited: "You're going a bit fast. Please wait a moment and try again.",
  unavailable: "The server is taking too long to respond. Please try again in a moment.",
  serverError: "Something went wrong on our side. Please try again.",
};

export async function clientFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api/backend${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (err) {
    // fetch() only rejects when no response arrived at all (offline, DNS,
    // the proxy itself unreachable). A deliberate abort is the caller's own
    // doing and passes through untouched.
    if (err?.name === "AbortError") throw err;
    const error = new Error(FRIENDLY_MESSAGES.network);
    error.status = 0;
    error.network = true;
    throw error;
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:expired"));
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(extractErrorMessage(data, res.status));
    error.status = res.status;
    error.fields = data;
    throw error;
  }

  return data;
}

function extractErrorMessage(data, status) {
  // Throttled and gateway failures get app-owned copy everywhere, whatever
  // raw text the backend or the host sent.
  if (status === 429) return FRIENDLY_MESSAGES.rateLimited;
  if (status === 502 || status === 503 || status === 504) return FRIENDLY_MESSAGES.unavailable;

  if (!data) {
    return status >= 500 ? FRIENDLY_MESSAGES.serverError : `Request failed: ${status}`;
  }
  if (data.error) return data.error;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) {
    return data[firstKey][0];
  }
  return `Request failed: ${status}`;
}