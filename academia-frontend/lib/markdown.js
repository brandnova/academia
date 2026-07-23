import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ breaks: true, gfm: true });

const ALLOWED_TAGS = ["p", "strong", "em", "del", "a", "ul", "ol", "li", "code", "pre", "blockquote", "br"];

export function renderMarkdown(text) {
  const rawHtml = marked.parse(text || "");
  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}

// Used for one-line previews (list rows, activity feed, profile tabs), not
// for full rendering. Deliberately approximate, just enough to keep raw
// syntax characters out of a truncated snippet, not a real parser.
export function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/^\s{0,3}>+\s?/gm, "")
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\n+/g, " ")
    .trim();
}