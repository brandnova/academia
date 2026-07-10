import { decodeJwtExp } from "@/lib/jwt";

const isProd = process.env.NODE_ENV === "production";

export function setAuthCookies(response, access, refresh) {
  const now = Math.floor(Date.now() / 1000);
  const accessExp = decodeJwtExp(access);
  const refreshExp = decodeJwtExp(refresh);

  response.cookies.set("access_token", access, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: accessExp ? Math.max(accessExp - now, 0) : 60 * 15,
  });

  response.cookies.set("refresh_token", refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: refreshExp ? Math.max(refreshExp - now, 0) : 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookies(response) {
  response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
}