/** One-line plain text for list snippets. Deliberately approximate, same rules as the web version. */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/^\s{0,3}>+\s?/gm, '')
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}