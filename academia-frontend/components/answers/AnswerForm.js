"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";

export default function AnswerForm({ questionId, locked, onCreated }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!user) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You need to log in to answer this question.
      </p>
    );
  }

  if (locked) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        This question has been locked and is no longer accepting new answers.
      </p>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const answer = await clientFetch("/answers/", {
        method: "POST",
        body: JSON.stringify({ question_id: questionId, body }),
      });
      onCreated(answer);
      setBody("");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        placeholder="Write your answer..."
        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-2"
      />
      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-2">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
      >
        {status === "loading" ? "Posting..." : "Post answer"}
      </button>
    </form>
  );
}