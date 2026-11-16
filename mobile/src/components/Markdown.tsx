import React, { useMemo } from 'react';
import { Linking, Platform, StyleProp, StyleSheet, Text as RNText, TextStyle, View, ViewStyle } from 'react-native';

import { fonts, useTheme } from '../theme';

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

type ListItem = { text: string; children: ListBlock[] };
type ListBlock = { type: 'list'; ordered: boolean; start: number; items: ListItem[] };
export type MarkdownBlock =
  | { type: 'p' | 'h1' | 'h2' | 'h3' | 'quote' | 'code'; text: string }
  | ListBlock
  | { type: 'hr' };

type FlatItem = { indent: number; ordered: boolean; number: number; text: string };

const LIST_LINE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

function buildList(flat: FlatItem[], pos: { i: number }, indent: number): ListBlock {
  const first = flat[pos.i];
  const list: ListBlock = { type: 'list', ordered: first.ordered, start: first.number, items: [] };
  while (pos.i < flat.length) {
    const cur = flat[pos.i];
    if (cur.indent < indent) break;
    const last = list.items[list.items.length - 1];
    if (cur.indent > indent && last) {
      last.children.push(buildList(flat, pos, cur.indent));
      continue;
    }
    if (cur.ordered !== list.ordered && list.items.length > 0) break;
    list.items.push({ text: cur.text, children: [] });
    pos.i += 1;
  }
  return list;
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = (markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join('\n').trim() });
      paragraph = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence[1])) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    if (/^\s*$/.test(line)) {
      flush();
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      blocks.push({ type: 'hr' });
      continue;
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      blocks.push({ type: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3', text: heading[2] });
      continue;
    }

    if (/^\s{0,3}>/.test(line)) {
      flush();
      const quote = [line.replace(/^\s{0,3}>\s?/, '')];
      while (index + 1 < lines.length && /^\s{0,3}>/.test(lines[index + 1])) {
        index += 1;
        quote.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
      }
      blocks.push({ type: 'quote', text: quote.join('\n') });
      continue;
    }

    if (LIST_LINE.test(line)) {
      flush();
      const flat: FlatItem[] = [];
      let j = index;
      for (; j < lines.length; j += 1) {
        const m = LIST_LINE.exec(lines[j]);
        if (!m) break;
        flat.push({ indent: m[1].replace(/\t/g, '    ').length, ordered: /\d/.test(m[2]), number: Number.parseInt(m[2], 10) || 1, text: m[3] });
      }
      index = j - 1;
      const pos = { i: 0 };
      while (pos.i < flat.length) blocks.push(buildList(flat, pos, flat[pos.i].indent));
      continue;
    }

    paragraph.push(line);
  }

  flush();
  return blocks;
}

/* ------------------------------ inline ------------------------------ */

interface InlineContext { accent: string; codeBg: string }

const RE = {
  escape: /\\([\\`*_{}[\]()#+\-.!~>|])/y,
  image: /!\[([^\]]*)\]\(([^)\s]+)\)/y,
  link: /\[([^\]]+)\]\(([^)\s]+)\)/y,
  code: /`([^`\n]+)`/y,
  bold: /(\*\*|__)(?=\S)([\s\S]*?\S)\1/y,
  strike: /~~(?=\S)([\s\S]*?\S)~~/y,
  italic: /(\*|_)(?=\S)([^\n]*?\S)\1/y,
  url: /https?:\/\/[^\s<]+/y,
};

const exec = (re: RegExp, text: string, at: number) => {
  re.lastIndex = at;
  return re.exec(text);
};
const isWord = (ch: string | undefined) => Boolean(ch) && /[A-Za-z0-9]/.test(ch as string);
/** Underscore emphasis only counts at word boundaries, so snake_case stays plain (same as the web renderer). */
const boundaryOk = (marker: string, text: string, at: number, length: number) => marker !== '_' && marker !== '__' ? true : !isWord(text[at - 1]) && !isWord(text[at + length]);

function openLink(url: string) {
  if (SAFE_URL.test(url)) Linking.openURL(url).catch(() => {});
}

function renderInline(text: string, keyPrefix: string, ctx: InlineContext): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let plain = '';
  let count = 0;
  const flush = () => {
    if (plain) nodes.push(plain);
    plain = '';
  };
  const push = (node: React.ReactNode) => {
    flush();
    nodes.push(node);
  };
  const nextKey = () => `${keyPrefix}-${count++}`;
  const link = (label: React.ReactNode, url: string) => {
    const key = nextKey();
    if (!SAFE_URL.test(url)) return push(<RNText key={key}>{label}</RNText>);
    push(
      <RNText key={key} onPress={() => openLink(url)} style={{ color: ctx.accent, textDecorationLine: 'underline', fontFamily: fonts.semibold }}>
        {label}
      </RNText>,
    );
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    let m: RegExpExecArray | null = null;

    if (ch === '\\' && (m = exec(RE.escape, text, i))) {
      plain += m[1];
      i += m[0].length;
      continue;
    }
    if (ch === '!' && (m = exec(RE.image, text, i))) {
      i += m[0].length;
      continue;
    }
    if (ch === '[' && (m = exec(RE.link, text, i))) {
      link(renderInline(m[1], nextKey(), ctx), m[2]);
      i += m[0].length;
      continue;
    }
    if (ch === '`' && (m = exec(RE.code, text, i))) {
      push(
        <RNText key={nextKey()} style={{ fontFamily: MONO, fontSize: 13, backgroundColor: ctx.codeBg }}>
          {m[1]}
        </RNText>,
      );
      i += m[0].length;
      continue;
    }
    if ((ch === '*' || ch === '_') && (m = exec(RE.bold, text, i)) && boundaryOk(m[1], text, i, m[0].length)) {
      push(
        <RNText key={nextKey()} style={{ fontFamily: fonts.bold }}>
          {renderInline(m[2], nextKey(), ctx)}
        </RNText>,
      );
      i += m[0].length;
      continue;
    }
    if (ch === '~' && (m = exec(RE.strike, text, i))) {
      push(
        <RNText key={nextKey()} style={{ textDecorationLine: 'line-through' }}>
          {renderInline(m[1], nextKey(), ctx)}
        </RNText>,
      );
      i += m[0].length;
      continue;
    }
    if ((ch === '*' || ch === '_') && (m = exec(RE.italic, text, i)) && boundaryOk(m[1], text, i, m[0].length)) {
      push(
        <RNText key={nextKey()} style={{ fontStyle: 'italic' }}>
          {renderInline(m[2], nextKey(), ctx)}
        </RNText>,
      );
      i += m[0].length;
      continue;
    }
    if (ch === 'h' && !isWord(text[i - 1]) && (m = exec(RE.url, text, i))) {
      const url = m[0].replace(/[.,;:!?'")\]]+$/, '');
      link(url, url);
      i += url.length;
      continue;
    }

    plain += ch;
    i += 1;
  }

  flush();
  return nodes;
}

/* ------------------------------ render ------------------------------ */

function renderList(block: ListBlock, key: string, bodyStyle: StyleProp<TextStyle>, ctx: InlineContext, muted: string, depth: number): React.ReactNode {
  return (
    <View key={key} style={[styles.list, depth > 0 && styles.nested]}>
      {block.items.map((item, i) => (
        <View key={`${key}-${i}`}>
          <View style={styles.listItem}>
            <RNText style={[bodyStyle, styles.bullet, { color: muted }]}>{block.ordered ? `${block.start + i}.` : depth % 2 === 0 ? '\u2022' : '\u25E6'}</RNText>
            <RNText style={[bodyStyle, styles.listText]}>{renderInline(item.text, `${key}-${i}`, ctx)}</RNText>
          </View>
          {item.children.map((child, c) => renderList(child, `${key}-${i}-${c}`, bodyStyle, ctx, muted, depth + 1))}
        </View>
      ))}
    </View>
  );
}

export function Markdown({ markdown, compact, allowHeadings = false, style }: { markdown: string; compact?: boolean; allowHeadings?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const blocks = useMemo(() => parseMarkdown(markdown ?? ''), [markdown]);
  const ctx: InlineContext = { accent: colors.accent, codeBg: colors.subtle };
  const bodyStyle: StyleProp<TextStyle> = { fontSize: compact ? 14 : 15, lineHeight: compact ? 22 : 24, fontFamily: fonts.regular, color: colors.textSecondary };

  if (blocks.length === 0) {
    return (
      <View style={style}>
        <RNText style={[bodyStyle, { color: colors.textFaint }]}>Nothing to preview yet.</RNText>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === 'code') {
          return (
            <View key={key} style={[styles.codeBlock, { backgroundColor: colors.surfaceMuted }]}>
              <RNText style={{ fontFamily: MONO, fontSize: 12.5, lineHeight: 19, color: colors.textSecondary }}>{block.text}</RNText>
            </View>
          );
        }
        if (block.type === 'hr') return <View key={key} style={[styles.hr, { backgroundColor: colors.divider }]} />;
        if (block.type === 'list') return renderList(block, key, bodyStyle, ctx, colors.textMuted, 0);

        if (block.type === 'quote') {
          return (
            <View key={key} style={[styles.quote, { borderLeftColor: colors.accent }]}>
              <RNText style={[bodyStyle, { fontStyle: 'italic', color: colors.textMuted }]}>{renderInline(block.text, key, ctx)}</RNText>
            </View>
          );
        }

        if (allowHeadings && (block.type === 'h1' || block.type === 'h2' || block.type === 'h3')) {
          const size = block.type === 'h1' ? 19 : block.type === 'h2' ? 17 : 15;
          return (
            <RNText key={key} style={{ fontSize: size, lineHeight: size * 1.35, fontFamily: fonts.bold, color: colors.text }}>
              {renderInline(block.text, key, ctx)}
            </RNText>
          );
        }

        return (
          <RNText key={key} style={bodyStyle}>
            {renderInline(block.text, key, ctx)}
          </RNText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  codeBlock: { borderRadius: 8, padding: 12 },
  hr: { height: 1, marginVertical: 4 },
  list: { gap: 5 },
  nested: { marginLeft: 18, marginTop: 5 },
  listItem: { flexDirection: 'row', gap: 8 },
  bullet: { minWidth: 20 },
  listText: { flex: 1 },
  quote: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 2 },
});