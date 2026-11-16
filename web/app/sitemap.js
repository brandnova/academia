import { apiFetch } from "@/lib/api";
import { schoolUrl } from "@/lib/urls";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Walks a paginated list endpoint. These caps are safety limits, not a
// URL-proliferation concern: every entry is a distinct, valuable, indexable
// page. They exist so sitemap generation cannot balloon into hundreds of
// backend calls as content grows. Revisit with Next's generateSitemaps()
// (several sitemap files) once real volume approaches them, see
// BUILD_LOG_FRONTEND.md. If a page fails midway, what was already collected
// is kept, so a brief backend hiccup never drops a whole section.
async function fetchAll(path, { pageSize, maxPages }) {
  const items = [];
  const separator = path.includes("?") ? "&" : "?";
  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const data = await apiFetch(`${path}${separator}page_size=${pageSize}&page=${page}`);
      items.push(...data.results);
      if (!data.next) break;
    }
  } catch {
    // sitemap generation should never fail the build if the backend is briefly down
  }
  return items;
}

export default async function sitemap() {
  const staticRoutes = ["", "/schools", "/tags", "/search"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const [schools, tags, questions] = await Promise.all([
    fetchAll("/schools/?has_hub=true", { pageSize: 100, maxPages: 10 }),
    fetchAll("/tags/?popular=true", { pageSize: 100, maxPages: 10 }),
    fetchAll("/questions/?ordering=-created_at", { pageSize: 50, maxPages: 25 }),
  ]);

  const schoolRoutes = schools.map((s) => ({
    // The canonical school URL carries its slug, same as the page's own
    // canonical tag.
    url: `${SITE_URL}${schoolUrl(s)}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const tagRoutes = tags.map((t) => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(t.name)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const questionRoutes = questions.map((q) => ({
    url: `${SITE_URL}/questions/${q.id}/${q.slug}`,
    lastModified: q.updated_at,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...schoolRoutes, ...tagRoutes, ...questionRoutes];
}