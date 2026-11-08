import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setAuthCookies, clearAuthCookies } from "@/lib/cookies";
import { refreshSession } from "@/lib/refreshSession";

const API_URL = process.env.BACKEND_API_URL;
const UNAVAILABLE_MESSAGE = "The server is unavailable right now. Please try again in a moment.";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
}

async function buildResponse(backendRes) {
  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await backendRes.json().catch(() => null);
  if (data !== null) {
    return NextResponse.json(data, { status: backendRes.status });
  }
  // The body was not JSON: a platform error page, or an empty error body.
  if (backendRes.ok) {
    return NextResponse.json({}, { status: backendRes.status });
  }
  return NextResponse.json(
    {
      error:
        backendRes.status >= 500 ? UNAVAILABLE_MESSAGE : `Request failed: ${backendRes.status}`,
    },
    { status: backendRes.status }
  );
}

async function handler(request, { params }) {
  const { path } = await params;
  const targetUrl = `${API_URL}/${path.join("/")}/${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  const method = request.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const bodyText = hasBody ? await request.text() : undefined;

  const callBackend = (token) =>
    fetch(targetUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: bodyText,
      cache: "no-store",
    });

  let backendRes;
  try {
    backendRes = await callBackend(accessToken);
  } catch {
    return unavailable();
  }

  if (backendRes.status !== 401 || !refreshToken) {
    return buildResponse(backendRes);
  }

  // Access token was rejected, rotate the pair (shared across concurrent
  // requests, see lib/refreshSession.js).
  const refreshed = await refreshSession(refreshToken);

  if (refreshed.kind === "unavailable") {
    // The session may well be valid, so the cookies stay untouched.
    return unavailable();
  }

  if (refreshed.kind === "invalid") {
    const response = NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
    clearAuthCookies(response);
    return response;
  }

  try {
    backendRes = await callBackend(refreshed.access);
  } catch {
    // The refresh itself worked and the old refresh token is now dead, so
    // the browser still has to receive the new pair.
    const response = unavailable();
    setAuthCookies(response, refreshed.access, refreshed.refresh);
    return response;
  }

  const response = await buildResponse(backendRes);
  setAuthCookies(response, refreshed.access, refreshed.refresh);
  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};