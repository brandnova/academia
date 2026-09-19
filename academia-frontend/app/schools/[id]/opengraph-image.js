import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api";
import { OgCard, loadOgFonts, truncateText } from "@/lib/og";
import { INSTITUTION_TYPE_LABELS, OWNERSHIP_LABELS } from "@/lib/schoolLabels";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getSchool(id) {
  try {
    return await apiFetch(`/schools/${id}/`);
  } catch {
    return null;
  }
}

export default async function Image({ params }) {
  const { id } = await params;
  const school = await getSchool(id);

  const title = school ? truncateText(school.name, 70) : "Academia";
  const meta = school
    ? `Academic Q&A hub for ${school.short_name} students`
    : "Academic Q&A for Nigerian tertiary students";
  const badges = school
    ? [INSTITUTION_TYPE_LABELS[school.institution_type], OWNERSHIP_LABELS[school.ownership]].filter(
        Boolean
      )
    : [];

  const fonts = await loadOgFonts(
    `Academia${title}${meta}${badges.join("")}Ask. Answer. Remember.`
  );

  return new ImageResponse(
    <OgCard eyebrow="School" title={title} meta={meta} badges={badges} />,
    { ...size, fonts }
  );
}