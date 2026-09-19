import { ImageResponse } from "next/og";
import { OgCard, loadOgFonts } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Academia — Academic Q&A for Nigerian tertiary students";

export default async function Image() {
  const title = "Academic answers, organized by school";
  const meta = "Find and share answers, organized by school and department";
  const fonts = await loadOgFonts(`Academia${title}${meta}Ask. Answer. Remember.`);

  return new ImageResponse(
    <OgCard eyebrow="Academic Q&A" title={title} meta={meta} />,
    { ...size, fonts }
  );
}