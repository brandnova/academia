import { apiFetch } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    // sitemap generation shouldn't fail the build if the backend is briefly down
  }

  return [...staticRoutes, ...schoolRoutes];
}