"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import EmptyState from "@/components/ui/EmptyState";
import AnswerCard from "./AnswerCard";
import AnswerForm from "./AnswerForm";
import AnswerHashFlash from "./AnswerHashFlash";
import BestAnswerHighlight from "./BestAnswerHighlight";

export default function AnswersSection({ question }) {
  const router = useRouter();
  const { user } = useAuth();
  const [answers, setAnswers] = useState(question.answers || []);

  const isQuestionOwner = user && user.id === question.author.id;
  const bestAnswer = answers.find((a) => a.is_best);

  function handleCreated(answer) {
    setAnswers((prev) => [...prev, answer]);
    router.refresh();
  }

  function handleUpdated(updated) {
    setAnswers((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleDeleted(answerId) {
    setAnswers((prev) => prev.filter((a) => a.id !== answerId));
    router.refresh();
  }

  async function handleMarkBest(answerId) {
    await clientFetch(`/answers/${answerId}/mark-best/`, { method: "POST" });
    setAnswers((prev) => prev.map((a) => ({ ...a, is_best: a.id === answerId })));
    router.refresh();
  }

  return (
    <div className="mt-8">
      <AnswerHashFlash />

      {bestAnswer && <BestAnswerHighlight answer={bestAnswer} />}

      <h2 className="font-semibold mb-4">
        {answers.length} Answer{answers.length !== 1 ? "s" : ""}
      </h2>

      {answers.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No answers yet"
          description="Be the first to help."
          className="mb-6"
        />
      ) : (
        <div className="space-y-3 mb-6">
          {answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              questionId={question.id}
              hubId={question.hub.id}
              canMarkBest={isQuestionOwner}
              onMarkBest={handleMarkBest}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              highlightBest={false}
            />
          ))}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="text-sm font-medium mb-3">Your answer</h3>
        <AnswerForm questionId={question.id} locked={question.is_locked} onCreated={handleCreated} />
      </div>
    </div>
  );
}