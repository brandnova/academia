import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setAuthCookies, clearAuthCookies } from "@/lib/cookies";

const API_URL = process.env.BACKEND_API_URL;

export const dynamic = "force-dynamic";

async function buildResponse(backendRes) {
  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
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

  let backendRes = await callBackend(accessToken);

  if (backendRes.status !== 401 || !refreshToken) {
    return buildResponse(backendRes);
  }

  // Access token was rejected, attempt exactly one refresh
  const refreshRes = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
    cache: "no-store",
  });

  if (!refreshRes.ok) {
    const response = NextResponse.json(
      { error: "Session expired. Please log in again." },
      { status: 401 }
    );
    clearAuthCookies(response);
    return response;
  }

  const refreshData = await refreshRes.json();
  backendRes = await callBackend(refreshData.access);
  const response = await buildResponse(backendRes);
  setAuthCookies(response, refreshData.access, refreshData.refresh);
  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};