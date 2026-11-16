/** "2h ago", "3d ago", then a short date - matches the design concept. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  const date = new Date(then);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
}
