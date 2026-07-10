"use client";

export async function clientFetch(path, options = {}) {
  const res = await fetch(`/api/backend${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

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
  if (!data) return `Request failed: ${status}`;
  if (data.error) return data.error;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) {
    return data[firstKey][0];
  }
  return `Request failed: ${status}`;
}