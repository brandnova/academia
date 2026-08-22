import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

async function getPage(slug) {
  try {
    return await apiFetch(`/pages/${slug}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.body.slice(0, 155),
  };
}

export default async function StaticPageView({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">{page.title}</h1>
      <p className="text-xs text-gray-400 mb-6">
        Last updated {new Date(page.updated_at).toLocaleDateString()}
        {page.created_by && ` by ${page.created_by.full_name}`}
      </p>
      <MarkdownRenderer content={page.body} className="text-[15px]" allowHeadings />
    </div>
  );
}