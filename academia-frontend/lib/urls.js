export function questionUrl(question) {
  if (!question?.id) return "/questions";
  return question.slug ? `/questions/${question.id}/${question.slug}` : `/questions/${question.id}`;
}