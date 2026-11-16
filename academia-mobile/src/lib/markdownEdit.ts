export interface Selection { start: number; end: number }
export interface Edit { text: string; start: number; end: number }
export interface InlineAction { before: string; after: string; placeholder: string; multilineBefore?: string; multilineAfter?: string }

export const INLINE = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '_', after: '_', placeholder: 'italic text' },
  strike: { before: '~~', after: '~~', placeholder: 'text' },
  code: { before: '`', after: '`', placeholder: 'code', multilineBefore: '```\n', multilineAfter: '\n```' },
} satisfies Record<string, InlineAction>;

/** Wrap the selection, or remove the markers when already wrapped or when the cursor sits inside them. */
export function toggleInline(value: string, sel: Selection, action: InlineAction): Edit {
  const { start, end } = sel;
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const { before: open, after: close } = action;

  if (selected.length >= open.length + close.length && selected.startsWith(open) && selected.endsWith(close)) {
    const inner = selected.slice(open.length, selected.length - close.length);
    return { text: before + inner + after, start, end: start + inner.length };
  }

  if (before.endsWith(open) && after.startsWith(close)) {
    const head = before.slice(0, before.length - open.length);
    return { text: head + selected + after.slice(close.length), start: head.length, end: head.length + selected.length };
  }

  const multiline = Boolean(action.multilineBefore) && selected.includes('\n');
  const left = multiline ? (action.multilineBefore as string) : open;
  const right = multiline ? (action.multilineAfter as string) : close;
  const body = selected || action.placeholder;
  return { text: before + left + body + right + after, start: start + left.length, end: start + left.length + body.length };
}

const BLOCK = { ul: /^(\s*)[-*+]\s+/, ol: /^(\s*)\d+[.)]\s+/, quote: /^\s{0,3}>\s?/ } as const;
const LIST_ANY = /^(\s*)([-*+]|\d+[.)])\s+/;

/** Prefix every line touched by the selection, or strip the prefix when all of them already have it. */
export function toggleBlock(value: string, sel: Selection, kind: 'ul' | 'ol' | 'quote'): Edit {
  const lineStart = sel.start === 0 ? 0 : value.lastIndexOf('\n', sel.start - 1) + 1;
  const nl = value.indexOf('\n', sel.end);
  const lineEnd = nl === -1 ? value.length : nl;
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const marker = BLOCK[kind];
  const filled = lines.filter((line) => line.trim() !== '');
  const remove = filled.length > 0 && filled.every((line) => marker.test(line));
  let count = 0;

  const next = lines.map((line) => {
    const blank = line.trim() === '';
    if (remove) return blank ? line : line.replace(marker, kind === 'quote' ? '' : '$1');
    if (blank && lines.length > 1) return line;
    count += 1;
    const clean = kind === 'quote' ? line : line.replace(LIST_ANY, '$1');
    const indent = kind === 'quote' ? '' : (/^\s*/.exec(clean) as RegExpExecArray)[0];
    const prefix = kind === 'ul' ? '- ' : kind === 'ol' ? `${count}. ` : '> ';
    return indent + prefix + clean.slice(indent.length);
  });

  const block = next.join('\n');
  const caret = lineStart + block.length;
  return { text: value.slice(0, lineStart) + block + value.slice(lineEnd), start: caret, end: caret };
}

/** Wrap the selection as a link. Selects the part the user types next (the label when nothing was selected, otherwise the URL). */
export function wrapLink(value: string, sel: Selection): Edit {
  const selected = value.slice(sel.start, sel.end);
  const before = value.slice(0, sel.start);
  const after = value.slice(sel.end);

  if (/^https?:\/\/\S+$/i.test(selected)) {
    return { text: `${before}[link](${selected})${after}`, start: sel.start + 1, end: sel.start + 5 };
  }

  const label = selected || 'link text';
  const text = `${before}[${label}](https://)${after}`;
  if (!selected) return { text, start: sel.start + 1, end: sel.start + 1 + label.length };
  const urlStart = sel.start + label.length + 3;
  return { text, start: urlStart, end: urlStart + 'https://'.length };
}

/**
 * Called with the previous and new text of a change. When the change is a single
 * inserted newline right after a list line, returns the edit that continues the list
 * (or exits it when the item was empty). Returns null for any other change.
 */
export function continueList(prev: string, next: string, hint: number | null): Edit | null {
  if (next.length !== prev.length + 1) return null;

  const fits = (at: number) => next[at] === '\n' && next.slice(0, at) + next.slice(at + 1) === prev;
  let at = -1;
  if (hint !== null && hint >= 0 && fits(hint)) at = hint;
  else {
    let i = 0;
    while (i < prev.length && prev[i] === next[i]) i += 1;
    if (fits(i)) at = i;
  }
  if (at < 0) return null;

  const lineStart = at === 0 ? 0 : next.lastIndexOf('\n', at - 1) + 1;
  const match = /^(\s*)([-*+]|(\d+)([.)]))\s+(.*)$/.exec(next.slice(lineStart, at));
  if (!match) return null;

  const rest = next.slice(at + 1);
  if (match[5].trim() === '') {
    const caret = lineStart + match[1].length;
    return { text: next.slice(0, lineStart) + match[1] + rest, start: caret, end: caret };
  }

  const marker = match[3] ? `${parseInt(match[3], 10) + 1}${match[4]}` : match[2];
  const insertion = `${match[1]}${marker} `;
  const caret = at + 1 + insertion.length;
  return { text: next.slice(0, at + 1) + insertion + rest, start: caret, end: caret };
}