"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import CommentRow from "./CommentRow";

export default function CommentThread({ answerId, commentCount, onCountChange }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const [newBody, setNewBody] = useState("");
  const [postStatus, setPostStatus] = useState("idle");
  const [postError, setPostError] = useState("");

  async function loadComments() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch(`/answers/${answerId}/comments/`);
      setComments(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && status === "idle") loadComments();
  }

  async function handlePost(e) {
    e.preventDefault();
    setPostStatus("loading");
    setPostError("");
    try {
      const comment = await clientFetch("/comments/", {
        method: "POST",
        body: JSON.stringify({ answer_id: answerId, body: newBody }),
      });
      setComments((prev) => [...prev, comment]);
      setNewBody("");
      onCountChange(commentCount + 1);
      setPostStatus("idle");
    } catch (err) {
      setPostStatus("error");
      setPostError(err.message);
    }
  }

  async function handleUpdate(commentId, body) {
    const updated = await clientFetch(`/comments/${commentId}/`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
  }

  async function handleDelete(commentId) {
    await clientFetch(`/comments/${commentId}/`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCountChange(Math.max(commentCount - 1, 0));
  }

  return (
    <div className="mt-3">
      <button onClick={toggle} className="text-xs text-accent hover:underline">
        {expanded
          ? "Hide comments"
          : commentCount === 0
          ? "Add a comment"
          : `Show ${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
      </button>

      {expanded && (
        <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
          {status === "loading" && <p className="text-xs text-gray-400">Loading comments...</p>}
          {status === "error" && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Couldn't load comments: {errorMsg}
            </p>
          )}
          {status === "ready" && comments.length === 0 && (
            <p className="text-xs text-gray-400">No comments yet.</p>
          )}
          {status === "ready" &&
            comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}

          {user ? (
            <form onSubmit={handlePost} className="flex items-start gap-2 pt-1">
              <input
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                required
                placeholder="Add a comment..."
                className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"
              />
              <button
                type="submit"
                disabled={postStatus === "loading"}
                className="text-xs px-2 py-1 rounded bg-accent text-white disabled:opacity-50"
              >
                {postStatus === "loading" ? "Posting..." : "Post"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">Log in to comment.</p>
          )}
          {postError && (
            <p className="text-xs text-red-600 dark:text-red-400">{postError}</p>
          )}
        </div>
      )}
    </div>
  );
}