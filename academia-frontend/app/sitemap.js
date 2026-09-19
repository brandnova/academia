import { apiFetch } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Safety cap, not a URL-proliferation concern like the filtered listing
// pages: these are all genuinely distinct, valuable, indexable URLs. The
// cap exists purely so sitemap generation can't balloon into hundreds of
// backend requests as the question count grows. Revisit with Next's
// generateSitemaps() (splitting into multiple sitemap files) once real
// volume approaches this number, see BUILD_LOG_FRONTEND.md.
const MAX_QUESTION_PAGES = 25;
const QUESTION_PAGE_SIZE = 50;

export default async function sitemap() {
  const staticRoutes = ["", "/schools", "/tags", "/search"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  let schoolRoutes = [];
  try {
    const schools = await apiFetch("/schools/?has_hub=true&page_size=100");
    schoolRoutes = schools.results.map((s) => ({
      url: `${SITE_URL}/schools/${s.id}`,
      lastModified: s.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    // sitemap generation shouldn't fail the build if the backend is briefly down
  }

  let tagRoutes = [];
  try {
    const tags = await apiFetch("/tags/?popular=true");
    tagRoutes = tags.results.map((t) => ({
      url: `${SITE_URL}/tags/${encodeURIComponent(t.name)}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // same as above
  }

  let questionRoutes = [];
  try {
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= MAX_QUESTION_PAGES) {
      const data = await apiFetch(
        `/questions/?ordering=-created_at&page_size=${QUESTION_PAGE_SIZE}&page=${page}`
      );
      questionRoutes.push(
        ...data.results.map((q) => ({
          url: `${SITE_URL}/questions/${q.id}/${q.slug}`,
          lastModified: q.updated_at,
          changeFrequency: "weekly",
          priority: 0.5,
        }))
      );
      hasNext = Boolean(data.next);
      page += 1;
    }
  } catch {
    // same as above
  }

  return [...staticRoutes, ...schoolRoutes, ...tagRoutes, ...questionRoutes];
}