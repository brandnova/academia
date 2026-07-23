import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownRenderer({ content }) {
  const html = renderMarkdown(content);
  return <div className="md-content text-sm" dangerouslySetInnerHTML={{ __html: html }} />;
}