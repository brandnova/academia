import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api";
import { OgCard, loadOgFonts, truncateText } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getTagCount(name) {
  try {
    const data = await apiFetch(`/tags/?search=${encodeURIComponent(name)}`);
    const exact = data.results.find((t) => t.name === name.toLowerCase());
    return exact ? exact.question_count : null;
  } catch {
    return null;
  }
}

export default async function Image({ params }) {
  const { name } = await params;
  const tagName = truncateText(decodeURIComponent(name), 60);
  const count = await getTagCount(tagName);

  const title = `${tagName} Questions & Answers`;
  const meta = "Browse questions on this topic, answered by students across Nigeria";
  const stat =
    count !== null && count > 0
      ? `${count} question${count !== 1 ? "s" : ""} answered`
      : null;

  const fonts = await loadOgFonts(`Academia${title}${meta}${stat || ""}Ask. Answer. Remember.`);

  return new ImageResponse(
    <OgCard eyebrow="Tag" title={title} meta={meta} stat={stat} />,
    { ...size, fonts }
  );
}