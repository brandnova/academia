import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import StatusIcon from "@/components/questions/StatusIcon";
import QuestionActions from "@/components/questions/QuestionActions";
import AnswersSection from "@/components/answers/AnswersSection";
import ReportButton from "@/components/reports/ReportButton";
import FollowButton from "@/components/questions/FollowButton";
import LockToggle from "@/components/questions/LockToggle";

async function getQuestion(id) {
  try {
    return await apiFetch(`/questions/${id}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) return {};
  return {
    title: question.title,
    description: question.body.slice(0, 155),
  };
}

export default async function QuestionDetailPage({ params }) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) notFound();

  return (
    <div className="max-w-3xl">
      <p className="text-sm mb-4">
        <Link
          href={`/hubs/${question.hub.id}`}
          className="flex items-center gap-1 text-accent hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> {question.hub.school.name}
        </Link>
      </p>

      <div className="flex items-start gap-3 mb-2">
        <div className="pt-1">
          <StatusIcon status={question.status} showLabel />
        </div>
        <h1 className="text-xl font-semibold flex-1">{question.title}</h1>
        {question.is_locked && (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 shrink-0 pt-1.5">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
        <span>Asked by {question.author.full_name}</span>
        {question.department && <span>{question.department.name}</span>}
        <span>{question.view_count} views</span>
      </div>

      {question.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-accent transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <div className="text-sm whitespace-pre-wrap mb-4">{question.body}</div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <QuestionActions question={question} />
        <ReportButton contentType="question" contentId={question.id} authorId={question.author.id} />
        <FollowButton questionId={question.id} initialFollowing={question.is_following} />
        <LockToggle question={question} />
      </div>

      <AnswersSection question={question} />
    </div>
  );
}