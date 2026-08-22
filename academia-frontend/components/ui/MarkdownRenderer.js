import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownRenderer({ content, className = "", allowHeadings = false }) {
  const html = renderMarkdown(content, { allowHeadings });
  return <div className={`md-content ${className || "text-sm"}`} dangerouslySetInnerHTML={{ __html: html }} />;
}