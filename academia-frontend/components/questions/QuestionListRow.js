import Link from "next/link";
import StatusIcon from "./StatusIcon";
import { questionUrl } from "@/lib/urls";
import { timeAgo } from "@/lib/timeAgo";

export default function QuestionListRow({ question, showSchool = false }) {
  return (
    <Link
      href={questionUrl(question)}
      className="flex items-start gap-3 py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="pt-1">
        <StatusIcon status={question.status} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{question.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{question.body}</p>
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
          {showSchool && question.hub?.school && (
            <span className="text-accent">{question.hub.school.short_name}</span>
          )}
          {question.department && <span>{question.department.name}</span>}
          <span>
            {question.answer_count} answer{question.answer_count !== 1 ? "s" : ""}
          </span>
          <span>{timeAgo(question.updated_at)}</span>
        </div>
      </div>
    </Link>
  );
}