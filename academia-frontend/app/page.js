import Link from "next/link";
import { School, Tag, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import HeroSearchBar from "@/components/home/HeroSearchBar";
import HeroIllustrationSlot from "@/components/home/HeroIllustrationSlot";
import RecentQuestionsList from "@/components/home/RecentQuestionsList";

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

  return (
    <div>
      <section className="text-center py-8 mb-10">
        <div className="flex items-center justify-center gap-6 mb-6">
          <HeroIllustrationSlot />
          <div>
            <h1 className="text-3xl font-semibold mb-2">Academia</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Academic answers for Nigerian tertiary students, organized by
              school, searchable, and here for the next student who asks the
              same question.
            </p>
          </div>
          <HeroIllustrationSlot />
        </div>
        <HeroSearchBar />
        <Link
          href="/schools"
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-4"
        >
          Browse schools <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
                    <Link href={`/schools/${s.id}`} className="text-sm hover:text-accent">
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
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 hover:border-accent hover:text-accent transition-colors"
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