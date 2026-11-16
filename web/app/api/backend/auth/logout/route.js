import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearAuthCookies } from "@/lib/cookies";

const API_URL = process.env.BACKEND_API_URL;

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => null);
  }

  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
}