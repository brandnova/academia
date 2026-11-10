"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import { fieldErrorsFrom } from "@/lib/formErrors";
import ErrorMessage from "@/components/ui/ErrorMessage";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

export default function AnswerForm({ questionId, locked, onCreated }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("idle");
  const [bodyError, setBodyError] = useState("");
  const [generalError, setGeneralError] = useState("");

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
    setBodyError("");
    setGeneralError("");
    if (!body.trim()) {
      setBodyError("Answer body is required.");
      return;
    }
    setStatus("loading");
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
      const parsed = fieldErrorsFrom(err, { body: "body" });
      setBodyError(parsed.fields.body);
      setGeneralError(parsed.general);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <MarkdownEditor
        value={body}
        onChange={(next) => {
          setBody(next);
          if (bodyError) setBodyError("");
        }}
        placeholder="Write your answer..."
        rows={4}
        aria-label="Your answer"
        invalid={Boolean(bodyError)}
      />
      <ErrorMessage className="mb-2">{bodyError || generalError}</ErrorMessage>
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