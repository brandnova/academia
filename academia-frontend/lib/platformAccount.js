// Identifies Academia's own seed/editorial account, if configured, purely
// so its name can carry a small visual marker wherever an author is shown.
// Deliberately not a role system: one hardcoded id comparison, not is_admin,
// not exposed on any serializer. Unset by default, nothing renders
// differently until NEXT_PUBLIC_PLATFORM_ACCOUNT_ID is actually set to a
// real user id.
const PLATFORM_ACCOUNT_ID = process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT_ID || null;

export function isPlatformAccount(authorId) {
  return Boolean(PLATFORM_ACCOUNT_ID) && authorId === PLATFORM_ACCOUNT_ID;
}