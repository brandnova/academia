export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export const OG_COLORS = {
  bg: "#FBFAF8",
  text: "#16140F",
  border: "#E5E3DF",
  muted: "#8A8778",
  accent: "#3454D1",
  accentSoft: "rgba(52, 84, 209, 0.1)",
};

const FONT_FAMILY_QUERY = "Plus+Jakarta+Sans";

// Satori (the engine behind ImageResponse) can't use next/font's self-hosted
// files directly, it needs raw font bytes handed to it per request. This
// fetches only the glyphs actually present in this image's text, per the
// documented next/og pattern, rather than the full font file.
export async function loadOgFonts(sampleText) {
  const weights = [500, 700, 800];
  const loaded = await Promise.all(
    weights.map(async (weight) => {
      try {
        const cssRes = await fetch(
          `https://fonts.googleapis.com/css2?family=${FONT_FAMILY_QUERY}:wght@${weight}&text=${encodeURIComponent(
            sampleText
          )}`
        );
        const css = await cssRes.text();
        const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
        if (!match) return null;
        const fontRes = await fetch(match[1]);
        const data = await fontRes.arrayBuffer();
        return { name: "Plus Jakarta Sans", data, weight, style: "normal" };
      } catch {
        return null;
      }
    })
  );
  return loaded.filter(Boolean);
}

export function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}\u2026` : text;
}

// Shared card layout, reused by every route's opengraph-image.js. Keeping
// this in one place is exactly the "reusable OG-card system" the issue asks
// for, rather than duplicating the visual design per content type.
export function OgCard({ eyebrow, title, meta, stat, badges = [] }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: OG_COLORS.bg,
        fontFamily: "Plus Jakarta Sans",
        padding: "56px 72px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 14,
          backgroundColor: OG_COLORS.accent,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: OG_COLORS.accent,
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          A
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: OG_COLORS.muted,
            textTransform: "uppercase",
          }}
        >
          Academia
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
          paddingRight: 40,
        }}
      >
        {eyebrow && (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              color: OG_COLORS.accent,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            fontSize: title.length > 60 ? 56 : 68,
            fontWeight: 800,
            color: OG_COLORS.text,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
        {meta && (
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: OG_COLORS.muted }}>
            {meta}
          </div>
        )}
        {stat && (
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: OG_COLORS.accent }}>
            {stat}
          </div>
        )}
        {badges.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
            {badges.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: 999,
                  backgroundColor: OG_COLORS.accentSoft,
                  color: OG_COLORS.accent,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${OG_COLORS.border}`,
          paddingTop: 26,
          fontSize: 22,
          color: OG_COLORS.muted,
        }}
      >
        <div style={{ display: "flex" }}>{SITE_HOST}</div>
        <div style={{ display: "flex" }}>Ask. Answer. Remember.</div>
      </div>
    </div>
  );
}