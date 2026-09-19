import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api";
import { OgCard, loadOgFonts, truncateText } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_LABELS = { OPEN: "Open", ANSWERED: "Answered", SOLVED: "Solved" };

async function getQuestion(id) {
  try {
    return await apiFetch(`/questions/${id}/`);
  } catch {
    return null;
  }
}

export default async function Image({ params }) {
  const { id } = await params;
  const question = await getQuestion(id);

  const title = question ? truncateText(question.title, 90) : "Academia";
  const meta = question
    ? [question.hub?.school?.name, question.department?.name].filter(Boolean).join(" · ")
    : "Academic Q&A for Nigerian tertiary students";
  const stat = question
    ? question.answer_count > 0
      ? `${question.answer_count} answer${question.answer_count !== 1 ? "s" : ""}${
          question.status === "SOLVED" ? ", solved" : ""
        }`
      : "No answers yet, be the first to help"
    : null;
  const badges = question ? (question.tags || []).slice(0, 3) : [];

  const fonts = await loadOgFonts(
    `Academia${title}${meta}${stat || ""}${badges.join("")}Ask. Answer. Remember.`
  );

  return new ImageResponse(
    <OgCard eyebrow="Question" title={title} meta={meta} stat={stat} badges={badges} />,
    { ...size, fonts }
  );
}