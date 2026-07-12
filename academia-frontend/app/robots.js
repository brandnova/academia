const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/moderation", "/profile", "/notifications"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}