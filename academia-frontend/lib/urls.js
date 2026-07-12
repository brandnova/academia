import { slugify } from "./slugify";

export function questionUrl(question) {
  if (!question?.id) return "/questions";
  const slug = question.slug || (question.title ? slugify(question.title) : "");
  return slug ? `/questions/${question.id}/${slug}` : `/questions/${question.id}`;
}