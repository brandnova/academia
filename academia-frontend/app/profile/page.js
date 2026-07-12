"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import ActivityFeed from "@/components/profile/ActivityFeed";
import PostHistoryTabs from "@/components/profile/PostHistoryTabs";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!user) {
    return <p className="text-gray-500 dark:text-gray-400">You need to log in to view this page.</p>;
  }

  const hasModerationAccess =
    (user.moderator_for?.length ?? 0) > 0 || (user.representative_for?.length ?? 0) > 0;

  function startEditing() {
    setName(user.full_name);
    setEditing(true);
  }

  async function saveName(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch("/users/me/", {
        method: "PATCH",
        body: JSON.stringify({ full_name: name }),
      });
      await refreshUser();
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-4 mb-6">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.full_name}
            className="w-16 h-16 rounded-full object-cover border border-[var(--color-border)] shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded bg-accent/10 text-accent flex items-center justify-center text-xl font-semibold shrink-0">
            {user.full_name?.[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              {editing ? (
                <form onSubmit={saveName} className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-lg font-semibold"
                  />
                  <button type="submit" disabled={status === "loading"} className="text-sm text-accent">
                    {status === "loading" ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-400">
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{user.full_name}</h1>
                  <button onClick={startEditing} aria-label="Edit name" className="text-gray-400 hover:text-accent">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
              {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errorMsg}</p>}
            </div>
            {user.is_admin && (
              <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent shrink-0">Admin</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          ["Questions", user.stats.question_count],
          ["Answers", user.stats.answer_count],
          ["Best answers", user.stats.best_answer_count],
          ["Comments", user.stats.comment_count],
        ].map(([label, value]) => (
          <div key={label} className="border border-[var(--color-border)] rounded-lg p-3 text-center">
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {hasModerationAccess && (
        <Link
          href="/moderation"
          className="flex items-center gap-2 text-sm text-accent hover:underline mb-8"
        >
          <ShieldCheck className="w-4 h-4" />
          Go to your moderation tools
        </Link>
      )}

      <div className="mb-8">
        <h2 className="font-medium mb-3">Recent activity</h2>
        <ActivityFeed userId={user.id} />
      </div>

      <div>
        <h2 className="font-medium mb-1">Your posts</h2>
        <PostHistoryTabs userId={user.id} />
      </div>
    </div>
  );
}