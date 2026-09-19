import TagQuestionsClient from "@/components/tags/TagQuestionsClient";

export async function generateMetadata({ params }) {
  const { name } = await params;
  const tagName = decodeURIComponent(name);
  const title = `${tagName} Questions & Answers`;
  const description = `Browse questions tagged "${tagName}" on Academia, answered by students across Nigerian tertiary institutions.`;
  const canonicalPath = `/tags/${encodeURIComponent(tagName)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${title} | Academia`,
      description,
      url: canonicalPath,
      type: "website",
    },
  };
}

export default async function TagQuestionsPage({ params }) {
  const { name } = await params;
  const tagName = decodeURIComponent(name);
  return <TagQuestionsClient tagName={tagName} />;
}