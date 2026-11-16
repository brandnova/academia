"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import CommentRow from "./CommentRow";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/FormControls";

export default function CommentThread({ answerId, hubId, commentCount, onCountChange }) {
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
        <div className="mt-2 pl-3 border-l-2 border-[var(--color-border)] space-y-2">
          {status === "loading" && <p className="text-xs text-muted">Loading comments...</p>}
          {status === "error" && (
            <ErrorMessage size="xs">
              Couldn't load comments: {errorMsg}
            </ErrorMessage>
          )}
          {status === "ready" && comments.length === 0 && (
            <p className="text-xs text-muted">No comments yet.</p>
          )}
          {status === "ready" &&
            comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                hubId={hubId}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}

          {user ? (
            <form onSubmit={handlePost} className="flex items-stretch gap-2 pt-1">
              <Input
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                required
                placeholder="Add a comment..."
                aria-label="Add a comment"
                size="xs"
                fullWidth={false}
                className="flex-1"
              />
              <button
                type="submit"
                disabled={postStatus === "loading"}
                className="text-xs px-2 py-2 rounded bg-accent text-white disabled:opacity-50"
              >
                {postStatus === "loading" ? "Posting..." : "Post"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-muted">Log in to comment.</p>
          )}
          {postError && (
            <ErrorMessage size="xs">{postError}</ErrorMessage>
          )}
        </div>
      )}
    </div>
  );
}