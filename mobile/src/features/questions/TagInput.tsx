import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { api } from '../../api/endpoints';
import { Icon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { useQuery } from '../../lib/useQuery';
import { radii, useTheme, webInputReset } from '../../theme';

const MAX_LENGTH = 50;

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string | null;
  onFocusChange?: (focused: boolean) => void;
}

/**
 * Tag picker like the web one: selected tags as removable chips, a live search input
 * (300 ms debounce), popular tags when the input is empty, and free text as a fallback.
 * The suggestion list renders inline under the field so it works inside any ScrollView.
 */
export function TagInput({ tags, onChange, error, onFocusChange }: TagInputProps) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const term = input.trim().toLowerCase();
  const query = useDebouncedValue(term, 300);

  const suggestions = useQuery((signal) => api.tags.list({ search: query || undefined, popular: true, page_size: 10 }, signal), [query], { enabled: focused });

  const addMany = (names: string[]) => {
    const next = [...tags];
    for (const raw of names) {
      const value = raw.trim().toLowerCase();
      if (!value) continue;
      if (value.length > MAX_LENGTH) {
        setLocalError(`Tag names must be ${MAX_LENGTH} characters or fewer.`);
        continue;
      }
      if (!next.includes(value)) next.push(value);
    }
    if (next.length !== tags.length) onChange(next);
  };

  const change = (text: string) => {
    setLocalError(null);
    if (!text.includes(',')) return setInput(text);
    const parts = text.split(',');
    const rest = parts.pop() ?? '';
    addMany(parts);
    setInput(rest);
  };

  const pick = (name: string) => {
    addMany([name]);
    setInput('');
  };

  const available = (suggestions.data?.results ?? []).filter((tag) => !tags.includes(tag.name));
  const canAddTyped = term.length > 0 && !tags.includes(term) && !available.some((tag) => tag.name === term);
  const shownError = localError ?? error ?? null;

  return (
    <View>
      <View style={[styles.box, { backgroundColor: colors.surface, borderColor: shownError ? colors.danger : colors.strong }]}>
        {tags.map((tag) => (
          <View key={tag} style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
            <Text size={12} color={colors.accent}>
              {tag}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove tag ${tag}`} hitSlop={10} onPress={() => onChange(tags.filter((item) => item !== tag))}>
              <Icon name="close" size={10} color={colors.accent} />
            </Pressable>
          </View>
        ))}
        <TextInput
          value={input}
          onChangeText={change}
          onSubmitEditing={() => pick(input)}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() =>
            setTimeout(() => {
              setFocused(false);
              onFocusChange?.(false);
            }, 150)
          }
          placeholder="Search or add tags..."
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          maxLength={MAX_LENGTH}
          blurOnSubmit={false}
          accessibilityLabel="Add a tag"
          style={[styles.input, webInputReset, { color: colors.ink }]}
        />
      </View>

      {shownError ? (
        <Text size={12} color={colors.danger} style={{ marginTop: 4 }}>
          {shownError}
        </Text>
      ) : null}

      {focused ? (
        <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.strong }]}>
          <Text size={11} color={colors.muted} style={styles.caption}>
            {term ? 'Matching tags' : 'Popular tags'}
          </Text>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 176 }} showsVerticalScrollIndicator={false}>
            {canAddTyped ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Add tag ${term}`} onPress={() => pick(term)} style={({ pressed }) => [styles.row, { borderTopColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
                <Icon name="plus" size={12} color={colors.accent} />
                <Text size={14} color={colors.accent} style={{ flex: 1 }} numberOfLines={1}>
                  Add &quot;{term}&quot;
                </Text>
              </Pressable>
            ) : null}
            {available.map((tag) => (
              <Pressable key={tag.id} accessibilityRole="button" accessibilityLabel={`Add tag ${tag.name}`} onPress={() => pick(tag.name)} style={({ pressed }) => [styles.row, { borderTopColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
                <Text size={14} style={{ flex: 1 }} numberOfLines={1}>
                  {tag.name}
                </Text>
                <Text size={12} color={colors.muted}>
                  {tag.question_count}
                </Text>
              </Pressable>
            ))}
            {suggestions.loading && !suggestions.data ? (
              <Text size={13} color={colors.muted} style={styles.note}>
                Loading tags...
              </Text>
            ) : suggestions.error ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Retry loading tags" onPress={suggestions.refetch}>
                <Text size={13} color={colors.danger} style={styles.note}>
                  {errorMessage(suggestions.error)} Tap to retry.
                </Text>
              </Pressable>
            ) : available.length === 0 && !canAddTyped ? (
              <Text size={13} color={colors.muted} style={styles.note}>
                No matching tags.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 8, minHeight: 48 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  input: { flex: 1, minWidth: 110, fontSize: 14, paddingVertical: 6 },
  dropdown: { marginTop: 6, borderWidth: 1, borderRadius: radii.md, overflow: 'hidden' },
  caption: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth },
  note: { paddingHorizontal: 14, paddingVertical: 12 },
});