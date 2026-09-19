import Link from "next/link";
import { School, Tag, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { schoolUrl } from "@/lib/urls";
import HeroSearchBar from "@/components/home/HeroSearchBar";
import RecentQuestionsList from "@/components/home/RecentQuestionsList";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Academia | Academic Q&A for Nigerian Tertiary Students",
  description:
    "Find and share answers to academic questions, GPA calculation, clearance, registration, SIWES, and more, organized by school and department so the same question never needs asking twice.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Academia",
    description:
      "Academic Q&A repository for Nigerian tertiary students, organized by school and searchable.",
    url: "/",
    type: "website",
    siteName: "Academia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia",
    description: "Academic Q&A repository for Nigerian tertiary students.",
  },
};

async function getSideData() {
  try {
    const [schools, tags] = await Promise.all([
      apiFetch("/schools/?has_hub=true&page_size=5"),
      apiFetch("/tags/?popular=true"),
    ]);
    return { schools: schools.results, tags: tags.results.slice(0, 8) };
  } catch {
    return { schools: [], tags: [] };
  }
}

export default async function HomePage() {
  const { schools, tags } = await getSideData();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Academia",
    url: SITE_URL,
    description:
      "Academic Q&A repository for Nigerian tertiary students, organized by school and department.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="full-bleed -mt-6 relative overflow-hidden border-b border-gray-200/70 dark:border-gray-800/70 mb-10">
        <div
          className="absolute inset-0 bg-accent/15 dark:bg-accent/10 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-cover.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

        <div className="relative px-6 py-16 sm:py-20 text-center max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Academia
          </h1>
          <p className="mb-7">
            Academic answers for Nigerian tertiary students, organized by schools, searchable, and here for the next students who need them.
          </p>
          <HeroSearchBar />
          <Link
            href="/schools"
            className="inline-flex items-center gap-1 text-sm text-white hover:text-white/80 underline underline-offset-4 mt-4"
          >
            Browse schools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8">
        <div>
          <h2 className="font-semibold mb-4">Recent questions</h2>
          <RecentQuestionsList />
        </div>

        <aside className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <School className="w-4 h-4" /> Schools
              </h3>
              <Link href="/schools" className="text-xs text-accent hover:underline">
                View all
              </Link>
            </div>
            {schools.length === 0 ? (
              <p className="text-xs text-gray-400">No schools yet.</p>
            ) : (
              <ul className="space-y-2">
                {schools.map((s) => (
                  <li key={s.id}>
                    <Link href={schoolUrl(s)} className="text-sm hover:text-accent">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Tags
              </h3>
              <Link href="/tags" className="text-xs text-accent hover:underline">
                View all
              </Link>
            </div>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400">No tags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tags/${encodeURIComponent(t.name)}`}
                    className="text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 hover:border-accent hover:text-accent transition-colors"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}