
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, TextInputSelectionChangeEvent, View } from 'react-native';

import { Icon, IconName } from './Icon';
import { Markdown } from './Markdown';
import { Text } from './Text';
import { continueList, Edit, INLINE, Selection, toggleBlock, toggleInline, wrapLink } from '../lib/markdownEdit';
import { fonts, radii, touchTarget, useTheme, webInputReset } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  /** 'bottom' docks the toolbar under the input, next to the keyboard. */
  toolbar?: 'top' | 'bottom';
}

const TOOLS: { icon: IconName; label: string; run: (value: string, sel: Selection) => Edit }[] = [
  { icon: 'bold', label: 'Bold', run: (v, s) => toggleInline(v, s, INLINE.bold) },
  { icon: 'italic', label: 'Italic', run: (v, s) => toggleInline(v, s, INLINE.italic) },
  { icon: 'strikethrough', label: 'Strikethrough', run: (v, s) => toggleInline(v, s, INLINE.strike) },
  { icon: 'link', label: 'Link', run: wrapLink },
  { icon: 'listUl', label: 'Bulleted list', run: (v, s) => toggleBlock(v, s, 'ul') },
  { icon: 'listOl', label: 'Numbered list', run: (v, s) => toggleBlock(v, s, 'ol') },
  { icon: 'quote', label: 'Quote', run: (v, s) => toggleBlock(v, s, 'quote') },
  { icon: 'code', label: 'Code', run: (v, s) => toggleInline(v, s, INLINE.code) },
];

/**
 * Markdown composer. Toolbar actions toggle formatting on and off, lists continue on
 * Enter, links wrap the selection. Preview uses the same Markdown renderer as display.
 */
export function MarkdownEditor({ value, onChangeText, placeholder = 'Add any context that would help someone answer...', minHeight = 110, maxHeight = 260, autoFocus, accessibilityLabel = 'Body', toolbar = 'top' }: Props) {
  const { colors } = useTheme();
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const sel = useRef<Selection>({ start: value.length, end: value.length });
  const [forced, setForced] = useState<Selection | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!forced) return;
    const timer = setTimeout(() => setForced(null), 400);
    return () => clearTimeout(timer);
  }, [forced]);

  const commit = (edit: Edit) => {
    sel.current = { start: edit.start, end: edit.end };
    onChangeText(edit.text);
    setForced({ start: edit.start, end: edit.end });
  };

  const handleChange = (next: string) => {
    const edit = continueList(value, next, sel.current.start);
    if (edit) commit(edit);
    else onChangeText(next);
  };

  const handleSelection = (event: TextInputSelectionChangeEvent) => {
    const next = event.nativeEvent.selection;
    sel.current = next;
    if (forced && next.start === forced.start && next.end === forced.end) setForced(null);
  };

  const run = (tool: (typeof TOOLS)[number]) => {
    const current = { start: Math.min(sel.current.start, value.length), end: Math.min(sel.current.end, value.length) };
    commit(tool.run(value, current));
    inputRef.current?.focus();
  };

  const bar = (
    <View style={[styles.toolbar, toolbar === 'bottom' ? { borderTopWidth: 1 } : { borderBottomWidth: 1 }, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.tools}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.label}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
            accessibilityState={{ disabled: preview }}
            disabled={preview}
            onPress={() => run(tool)}
            style={({ pressed }) => [styles.tool, { backgroundColor: pressed ? colors.accentSoft : 'transparent', opacity: preview ? 0.35 : 1 }]}
          >
            <Icon name={tool.icon} size={15} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel={preview ? 'Write' : 'Preview'} onPress={() => setPreview((current) => !current)} style={[styles.previewToggle, { borderLeftColor: colors.border }]}>
        <Icon name={preview ? 'edit' : 'eye'} size={13} color={preview ? colors.accent : colors.textMuted} />
        <Text size={12} weight="semibold" color={preview ? colors.accent : colors.textMuted}>
          {preview ? 'Write' : 'Preview'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {toolbar === 'top' ? bar : null}

      {preview ? (
        <View style={{ minHeight, padding: 14 }}>
          <Markdown markdown={value} />
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          onSelectionChange={handleSelection}
          selection={forced ?? undefined}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          multiline
          autoFocus={autoFocus}
          accessibilityLabel={accessibilityLabel}
          style={[styles.input, webInputReset, { minHeight, maxHeight, color: colors.text }]}
        />
      )}

      {toolbar === 'bottom' ? bar : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center' },
  tools: { alignItems: 'center' },
  tool: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  previewToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, height: touchTarget, paddingHorizontal: 12, borderLeftWidth: StyleSheet.hairlineWidth },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlignVertical: 'top' },
});
