"use client";

import { useState } from "react";
import { CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

export default function AnswerCard({ answer, questionId, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const isAuthor = user && user.id === answer.author.id;
  const canVote = user && !isAuthor;

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(answer.body);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Session-only: the API has no field for the current user's existing vote
  // on an answer, so this only reflects votes cast during this visit.
  // null = no known vote, "UP"/"DOWN" = voted this session, "blocked" = the
  // server says we already voted, direction unknown. See BUILD_LOG.
  const [voteState, setVoteState] = useState(null);
  const [voteStatus, setVoteStatus] = useState("idle");
  const [voteError, setVoteError] = useState("");

  async function refreshVoteScore() {
    try {
      const data = await clientFetch(`/questions/${questionId}/`);
      const fresh = data.answers.find((a) => a.id === answer.id);
      if (fresh) onUpdated(fresh);
    } catch {
      // best-effort, the optimistic UI already reflects the action either way
    }
  }

  async function handleVote(voteType) {
    setVoteStatus("loading");
    setVoteError("");
    try {
      await clientFetch(`/answers/${answer.id}/vote/`, {
        method: "POST",
        body: JSON.stringify({ vote_type: voteType }),
      });
      setVoteState(voteType);
      await refreshVoteScore();
    } catch (err) {
      if (err.status === 400 && /already voted/i.test(err.message)) {
        setVoteState("blocked");
      } else {
        setVoteError(err.message);
      }
    } finally {
      setVoteStatus("idle");
    }
  }

  async function handleRemoveVote() {
    setVoteStatus("loading");
    setVoteError("");
    try {
      await clientFetch(`/answers/${answer.id}/vote/`, { method: "DELETE" });
      setVoteState(null);
      await refreshVoteScore();
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setVoteStatus("idle");
    }
  }

  async function handleSave() {
    setSaveStatus("loading");
    setErrorMsg("");
    try {
      const updated = await clientFetch(`/answers/${answer.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      });
      onUpdated(updated);
      setEditing(false);
      setSaveStatus("idle");
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err.message);
    }
  }

  async function handleDelete() {
    setDeleteStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch(`/answers/${answer.id}/`, { method: "DELETE" });
      onDeleted(answer.id);
    } catch (err) {
      setDeleteStatus("error");
      setErrorMsg(err.message);
    }
  }

  function renderVoteControl() {
    if (!canVote) {
      return (
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3.5 h-3.5" />
          {answer.vote_score}
        </span>
      );
    }

    if (voteState === "UP" || voteState === "DOWN") {
      const Icon = voteState === "UP" ? ThumbsUp : ThumbsDown;
      return (
        <span className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 ${
              voteState === "UP" ? "text-accent" : "text-red-500"
            }`}
          >
            <Icon className="w-3.5 h-3.5 fill-current" />
            {answer.vote_score}
          </span>
          <button
            onClick={handleRemoveVote}
            disabled={voteStatus === "loading"}
            className="text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            Remove vote
          </button>
        </span>
      );
    }

    if (voteState === "blocked") {
      return (
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            {answer.vote_score}
          </span>
          <span className="text-gray-400">Already voted</span>
          <button
            onClick={handleRemoveVote}
            disabled={voteStatus === "loading"}
            className="text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            Remove vote
          </button>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2">
        <button
          onClick={() => handleVote("UP")}
          disabled={voteStatus === "loading"}
          aria-label="Upvote"
          className="hover:text-accent disabled:opacity-50"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <span>{answer.vote_score}</span>
        <button
          onClick={() => handleVote("DOWN")}
          disabled={voteStatus === "loading"}
          aria-label="Downvote"
          className="hover:text-red-500 disabled:opacity-50"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  return (
    <div
      className={`py-5 px-4 rounded-lg border ${
        answer.is_best
          ? "border-accent bg-accent/5"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {answer.is_best && (
        <div className="flex items-center gap-1.5 text-accent text-xs font-medium mb-2">
          <CheckCircle2 className="w-4 h-4" /> Best answer
        </div>
      )}

      {editing ? (
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-2"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saveStatus === "loading"}
              className="text-sm px-3 py-1.5 rounded bg-accent text-white disabled:opacity-50"
            >
              {saveStatus === "loading" ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setBody(answer.body);
              }}
              className="text-sm text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{answer.body}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {renderVoteControl()}
          <span className="text-gray-400">
            {answer.comment_count} comment{answer.comment_count !== 1 ? "s" : ""} (Phase 9)
          </span>
        </div>
        <span>by {answer.author.full_name}</span>
      </div>

      {voteError && <p className="text-red-600 dark:text-red-400 text-xs mt-2">{voteError}</p>}

      {isAuthor && !editing && (
        <div className="flex items-center gap-3 mt-3 text-xs">
          <button onClick={() => setEditing(true)} className="text-accent hover:underline">
            Edit
          </button>
          {confirming ? (
            <span className="flex items-center gap-2">
              <span className="text-gray-500">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleteStatus === "loading"}
                className="text-red-600 dark:text-red-400 disabled:opacity-50"
              >
                {deleteStatus === "loading" ? "Deleting..." : "Confirm"}
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
        </div>
      )}

      {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-2">{errorMsg}</p>}
    </div>
  );
}