import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/cookies";

const API_URL = process.env.BACKEND_API_URL;

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/auth/google/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.access, data.refresh);
  return response;
}