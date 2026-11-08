import { questionUrl } from "@/lib/urls";

// The backend sends link_target on notifications and reports:
//   null, or { question_id, question_slug, answer_id }
// answer_id is null for a question, and for a comment it is the comment's
// parent answer. Returns a URL string, or null when there is nothing to link
// to (content deleted, or an account notice).
export function linkTargetUrl(linkTarget) {
  if (!linkTarget?.question_id) return null;
  const base = questionUrl({ id: linkTarget.question_id, slug: linkTarget.question_slug });
  return linkTarget.answer_id ? `${base}#answer-${linkTarget.answer_id}` : base;
}