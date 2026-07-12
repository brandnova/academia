"use client";

import { useState } from "react";
import QuestionsTab from "./QuestionsTab";
import AnswersTab from "./AnswersTab";
import CommentsTab from "./CommentsTab";

const TABS = [
  { key: "questions", label: "Questions" },
  { key: "answers", label: "Answers" },
  { key: "comments", label: "Comments" },
];

export default function PostHistoryTabs({ userId }) {
  const [tab, setTab] = useState("questions");

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-2 border-b-2 -mb-px ${
              tab === t.key
                ? "border-accent text-accent font-medium"
                : "border-transparent text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "questions" && <QuestionsTab userId={userId} />}
      {tab === "answers" && <AnswersTab />}
      {tab === "comments" && <CommentsTab />}
    </div>
  );
}