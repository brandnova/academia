// Identifies Academia's own seed/editorial account(s), if configured, purely
// so their name can carry a small visual marker wherever an author is shown.
// Deliberately not a role system: a fixed list of ids, not is_admin, not
// exposed on any serializer. Comma-separated so more than one account can
// carry the mark without a schema or code change, e.g. if a second
// editorial persona is ever added. Empty by default, nothing renders
// differently until NEXT_PUBLIC_PLATFORM_ACCOUNT_ID is actually set.
const PLATFORM_ACCOUNT_IDS = new Set(
  (process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export function isPlatformAccount(authorId) {
  return Boolean(authorId) && PLATFORM_ACCOUNT_IDS.has(authorId);
}