import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import StatusIcon from "@/components/questions/StatusIcon";
import QuestionActions from "@/components/questions/QuestionActions";

async function getQuestion(id) {
  try {
    return await apiFetch(`/questions/${id}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export default async function QuestionDetailPage({ params }) {
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) notFound();

  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-4">
        <Link href={`/hubs/${question.hub.id}`} className="text-accent hover:underline">
          &larr; {question.hub.school.name}
        </Link>
      </p>

      <div className="flex items-start gap-3 mb-2">
        <div className="pt-1">
          <StatusIcon status={question.status} showLabel />
        </div>
        <h1 className="text-xl font-semibold">{question.title}</h1>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
        <span>Asked by {question.author.full_name}</span>
        {question.department && <span>{question.department.name}</span>}
        <span>{question.view_count} views</span>
      </div>

      {question.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-sm whitespace-pre-wrap mb-6">{question.body}</div>

      <QuestionActions question={question} />

      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-400 mt-8">
        <p>
          {question.answer_count} answer{question.answer_count !== 1 ? "s" : ""}. Answer
          display, voting, and comments arrive in Phase 7 onward.
        </p>
      </div>
    </div>
  );
}