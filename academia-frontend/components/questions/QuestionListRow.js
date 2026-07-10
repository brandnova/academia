import Link from "next/link";
import StatusIcon from "./StatusIcon";

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export default function QuestionListRow({ question }) {
  return (
    <Link
      href={`/questions/${question.id}`}
      className="flex items-start gap-3 py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="pt-1">
        <StatusIcon status={question.status} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{question.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{question.body}</p>
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
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