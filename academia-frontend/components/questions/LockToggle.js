"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

export default function LockToggle({ question }) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canLock =
    user &&
    (user.is_admin ||
      user.moderator_for?.some((m) => m.hub_id === question.hub.id) ||
      user.representative_for?.some((r) => r.hub_id === question.hub.id));

  if (!canLock) return null;

  async function toggle() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const method = question.is_locked ? "DELETE" : "POST";
      await clientFetch(`/questions/${question.id}/lock/`, { method });
      setStatus("idle");
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={status === "loading"}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border disabled:opacity-50 ${
          question.is_locked
            ? "border-red-300 text-red-600 dark:text-red-400"
            : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        }`}
      >
        {question.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {status === "loading" ? "..." : question.is_locked ? "Unlock question" : "Lock question"}
      </button>
      {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errorMsg}</p>}
    </div>
  );
}