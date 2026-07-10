"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

export default function QuestionActions({ question }) {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!user || user.id !== question.author.id) return null;

  async function handleDelete() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch(`/questions/${question.id}/`, { method: "DELETE" });
      router.push(`/hubs/${question.hub.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="flex items-center gap-3 mb-6 text-sm">
      <Link href={`/questions/${question.id}/edit`} className="text-accent hover:underline">
        Edit
      </Link>
      {confirming ? (
        <span className="flex items-center gap-2">
          <span className="text-gray-500">Delete this question?</span>
          <button
            onClick={handleDelete}
            disabled={status === "loading"}
            className="text-red-600 dark:text-red-400 disabled:opacity-50"
          >
            {status === "loading" ? "Deleting..." : "Confirm"}
          </button>
          <button onClick={() => setConfirming(false)} className="text-gray-400">
            Cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-red-600 dark:text-red-400 hover:underline"
        >
          Delete
        </button>
      )}
      {status === "error" && <span className="text-red-600 dark:text-red-400">{errorMsg}</span>}
    </div>
  );
}