import SearchResultsClient from "@/components/search/SearchResultsClient";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const q = params?.q?.trim();

  const title = q ? `Search results for "${q}"` : "Search";
  const description = q
    ? `Academia search results for "${q}".`
    : "Search questions and answers across every school on Academia.";

  return {
    title,
    description,
    alternates: { canonical: "/search" },
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default function SearchPage() {
  return <SearchResultsClient />;
}