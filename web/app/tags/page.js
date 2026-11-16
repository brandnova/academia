import TagsBrowseClient from "@/components/tags/TagsBrowseClient";

export const metadata = {
  title: "Browse Tags",
  description:
    "Browse Academia Atlas' question tags by topic, from GPA calculation to SIWES, to find existing answers before asking a new question.",
  alternates: { canonical: "/tags" },
  openGraph: {
    title: "Browse Tags | Academia Atlas",
    description: "Browse Academia Atlas' question tags by topic.",
    url: "/tags",
    type: "website",
  },
};

export default function TagsPage() {
  return <TagsBrowseClient />;
}