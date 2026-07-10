"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function GoogleLoginButton() {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { refreshUser } = useAuth();

  function handleClick() {
    if (!window.google) return;
    setStatus("loading");
    setErrorMsg("");

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setStatus("error");
          setErrorMsg("Google sign-in was cancelled or failed.");
          return;
        }
        try {
          const res = await fetch("/api/backend/auth/google/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: tokenResponse.access_token }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || "Login failed");
          }
          await refreshUser();
          setStatus("idle");
          router.push("/");
        } catch (err) {
          setStatus("error");
          setErrorMsg(err.message);
        }
      },
    });

    client.requestAccessToken();
  }

  return (
    <div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 text-sm"
      >
        {status === "loading" ? "Signing in..." : "Sign in with Google"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errorMsg}</p>
      )}
    </div>
  );
}