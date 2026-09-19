import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, User, Building2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { schoolUrl } from "@/lib/urls";
import StatusIcon from "@/components/questions/StatusIcon";
import QuestionActions from "@/components/questions/QuestionActions";
import AnswersSection from "@/components/answers/AnswersSection";
import FollowButton from "@/components/questions/FollowButton";
import LockToggle from "@/components/questions/LockToggle";
import PlatformAuthorBadge from "@/components/ui/PlatformAuthorBadge";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

  const description = question.body.replace(/\s+/g, " ").trim().slice(0, 155);
  const canonicalPath = `/questions/${question.id}/${question.slug}`;
  const schoolName = question.hub?.school?.name;

  return {
    title: question.title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: question.title,
      description,
      url: canonicalPath,
      type: "article",
      siteName: "Academia",
    },
    twitter: {
      card: "summary_large_image",
      title: question.title,
      description,
    },
    other: schoolName ? { "og:section": schoolName } : undefined,
  };
}

export default async function QuestionDetailPage({ params }) {
  const { id } = await params;
  const question = await getQuestion(id);
  if (!question) notFound();

  const schoolPath = schoolUrl(question.hub.school);
  const questionPath = `/questions/${question.id}/${question.slug}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Academia", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: question.hub.school.name,
        item: `${SITE_URL}${schoolPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: question.title,
        item: `${SITE_URL}${questionPath}`,
      },
    ],
  };

  return (
    <div className="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link
          href={schoolPath}
          className="flex items-center gap-1.5 text-accent hover:underline w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> {question.hub.school.name}
        </Link>
      </nav>

      <div className="flex items-start gap-3 mb-2">
        <h1 className="text-xl md:text-3xl font-semibold flex-1">{question.title}</h1>
        <div className="pt-1">
          <StatusIcon status={question.status} showLabel />
        </div>
        {question.is_locked && (
          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 shrink-0 pt-1.5">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <User size={14} /> Asked by {question.author.full_name}
          <PlatformAuthorBadge authorId={question.author.id} />
        </span>
        {question.department && (
          <span className="flex items-center gap-1">
            <Building2 size={14} /> {question.department.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Eye size={14} /> {question.view_count} views
        </span>
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

      <div className="mb-4">
        <MarkdownRenderer content={question.body} className="text-[18px] md:text-2xl!" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <FollowButton questionId={question.id} initialFollowing={question.is_following} />
        <LockToggle question={question} />
        <QuestionActions question={question} />
      </div>

      <AnswersSection question={question} />
    </div>
  );
}