"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import ErrorMessage from "@/components/ui/ErrorMessage";

const SUPPORT_EMAIL = "brandnova.dev@gmail.com";

export default function GoogleLoginButton() {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [suspended, setSuspended] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  function fail(message, isSuspended = false) {
    setStatus("error");
    setErrorMsg(message);
    setSuspended(isSuspended);
  }

  function dismiss() {
    setStatus("idle");
    setErrorMsg("");
    setSuspended(false);
  }

  function handleClick() {
    if (!scriptReady || !window.google) {
      fail("Still loading Google sign-in, try again in a moment.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    setSuspended(false);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          fail("Google sign-in was cancelled or failed.");
          return;
        }
        try {
          await clientFetch("/auth/google/", {
            method: "POST",
            body: JSON.stringify({ access_token: tokenResponse.access_token }),
          });
          await refreshUser();
          setStatus("idle");
          router.push("/");
        } catch (err) {
          if (err.status === 403) {
            fail(err.message, true);
          } else if (err.status === 401) {
            fail("We couldn't verify your Google account. Please try again.");
          } else {
            fail(err.message);
          }
        }
      },
    });

    client.requestAccessToken();
  }

  return (
    <div className="relative">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() =>
          fail("Couldn't load Google sign-in. Check your connection and refresh.")
        }
      />
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="flex items-center gap-2 px-4 py-2 rounded border border-[var(--color-border-strong)] disabled:opacity-50 text-sm"
      >
        {status === "loading" ? "Signing in..." : "Sign in with Google"}
      </button>

      {status === "error" && (
        <div className="absolute right-0 top-full mt-2 w-64 z-dropdown rounded-lg border border-[var(--color-border)] bg-white dark:bg-gray-800 shadow-lg p-3">
          <ErrorMessage size="xs">{errorMsg}</ErrorMessage>
          {suspended && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              If you think this is a mistake, contact {SUPPORT_EMAIL}.
            </p>
          )}
          <button type="button" onClick={dismiss} className="text-xs text-accent hover:underline mt-2">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}