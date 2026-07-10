"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function CommentRow({ comment, onUpdate, onDelete }) {
  const { user } = useAuth();
  const isAuthor = user && user.id === comment.author.id;

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function save() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await onUpdate(comment.id, body);
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
    }
  }

  async function remove() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await onDelete(comment.id);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
    }
  }

  if (editing) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 min-w-[120px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"
          />
          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <button onClick={save} disabled={status === "loading"} className="text-accent">
              {status === "loading" ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setBody(comment.body);
              }}
              className="text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
        {errorMsg && (
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 mb-0.5">{comment.author.full_name}</p>
        <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{comment.body}</p>
      </div>

      {isAuthor && (
        <div className="text-[11px] flex items-center gap-2 text-gray-400 shrink-0">
          {confirming ? (
            <>
              <button
                onClick={remove}
                disabled={status === "loading"}
                className="hover:text-red-500"
              >
                {status === "loading" ? "Deleting..." : "Confirm delete"}
              </button>
              <button onClick={() => setConfirming(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="hover:text-accent">
                Edit
              </button>
              <button onClick={() => setConfirming(true)} className="hover:text-red-500">
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {errorMsg && <p className="text-[11px] text-red-600 dark:text-red-400 w-full">{errorMsg}</p>}
    </div>
  );
}