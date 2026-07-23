"use client";

import { CheckCircle2, ThumbsUp, ArrowDown } from "lucide-react";
import { stripMarkdown } from "@/lib/markdown";

export default function BestAnswerHighlight({ answer }) {
  function jumpToAnswer() {
    const el = document.getElementById(`answer-${answer.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-accent");
    setTimeout(() => el.classList.remove("ring-2", "ring-accent"), 1500);
  }

  return (
    <div className="mb-6 p-4 rounded-lg border border-accent bg-accent/5">
      <div className="flex items-center gap-1.5 text-accent text-xs font-medium mb-2">
        <CheckCircle2 className="w-4 h-4" /> Best answer
      </div>
      <p className="text-sm line-clamp-4">{stripMarkdown(answer.body)}</p>
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3.5 h-3.5" />
          {answer.vote_score}
        </span>
        <span>by {answer.author.full_name}</span>
      </div>
      <button
        onClick={jumpToAnswer}
        className="flex items-center gap-1 text-xs text-accent hover:underline mt-3"
      >
        View in list <ArrowDown className="w-3 h-3" />
      </button>
    </div>
  );
}