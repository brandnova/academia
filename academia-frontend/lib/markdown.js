import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ breaks: true, gfm: true });

const BASE_TAGS = ["p", "strong", "em", "del", "a", "ul", "ol", "li", "code", "pre", "blockquote", "br"];
const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

// allowHeadings defaults false: Q&A content stays exactly as restrictive as
// before, static pages opt in explicitly. Same sanitizer, same base rules,
// nothing loosened for the case that doesn't need it.
export function renderMarkdown(text, { allowHeadings = false } = {}) {
  const rawHtml = marked.parse(text || "");
  return sanitizeHtml(rawHtml, {
    allowedTags: allowHeadings ? [...BASE_TAGS, ...HEADING_TAGS] : BASE_TAGS,
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