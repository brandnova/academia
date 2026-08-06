import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownRenderer({ content, className="" }) {
  const html = renderMarkdown(content);
  return <div className={`md-content text-sm ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}