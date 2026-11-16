import { slugify } from "./slugify";

export function questionUrl(question) {
  if (!question?.id) return "/questions";
  const slug = question.slug || (question.title ? slugify(question.title) : "");
  return slug ? `/questions/${question.id}/${slug}` : `/questions/${question.id}`;
}

export function schoolUrl(school) {
  if (!school?.id) return "/schools";
  const slug = school.slug || (school.name ? slugify(school.name) : "");
  return slug ? `/schools/${school.id}/${slug}` : `/schools/${school.id}`;
}