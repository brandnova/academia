import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/cookies";

const API_URL = process.env.BACKEND_API_URL;
const UNAVAILABLE_MESSAGE = "The server is unavailable right now. Please try again in a moment.";
const FAILED_MESSAGE = "Sign-in failed. Please try again.";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let res;
  try {
    res = await fetch(`${API_URL}/auth/google/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Pass the backend's own message through (suspended 403, invalid token
    // 401, rate limit 429). Fall back only when the body was not JSON.
    return NextResponse.json(data ?? { error: FAILED_MESSAGE }, { status: res.status });
  }

  if (!data?.access || !data?.refresh || !data?.user) {
    return NextResponse.json({ error: FAILED_MESSAGE }, { status: 502 });
  }

  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.access, data.refresh);
  return response;
}