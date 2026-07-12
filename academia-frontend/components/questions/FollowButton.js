"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

export default function FollowButton({ questionId, initialFollowing }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!user) return null;

  async function toggle() {
    setStatus("loading");
    setErrorMsg("");
    try {
      if (following) {
        await clientFetch(`/questions/${questionId}/follow/`, { method: "DELETE" });
        setFollowing(false);
      } else {
        await clientFetch(`/questions/${questionId}/follow/`, { method: "POST" });
        setFollowing(true);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={status === "loading"}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border disabled:opacity-50 ${
          following
            ? "border-accent text-accent"
            : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        }`}
      >
        {following ? <Bell className="w-3.5 h-3.5 fill-current" /> : <BellOff className="w-3.5 h-3.5" />}
        {status === "loading" ? "..." : following ? "Following" : "Follow"}
      </button>
      {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errorMsg}</p>}
    </div>
  );
}