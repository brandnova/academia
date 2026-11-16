import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { api } from '../../api/endpoints';
import type { Tag } from '../../api/types';
import { Chip } from '../../components/Chips';
import { SearchField } from '../../components/SearchField';
import { Sheet } from '../../components/Sheet';
import { ErrorState, ViewMoreButton } from '../../components/States';
import { TagRow } from '../../components/TagRow';
import { Text } from '../../components/Text';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { usePagedList } from '../../lib/usePagedList';
import { useQuery } from '../../lib/useQuery';
import { useTheme } from '../../theme';

/**
 * Single-select tag filter like the web one: the selected tag as a removable chip, the most
 * popular tags as chips, and "More tags" opening a searchable, paginated list.
 */
export function TagFilter({ value, onChange }: { value: string; onChange: (tag: string) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);

  const popular = useQuery((signal) => api.tags.list({ popular: true, page_size: 8 }, signal), []);
  const list = usePagedList<Tag>((page, signal) => api.tags.list({ search: debounced || undefined, popular: true, page, page_size: 20 }, signal), [debounced], { enabled: open });

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} contentContainerStyle={styles.row}>
        {value ? <Chip label={value} active iconRight="close" accessibilityLabel={`Remove tag filter ${value}`} onPress={() => onChange('')} /> : null}
        {(popular.data?.results ?? [])
          .filter((tag) => tag.name !== value)
          .map((tag) => (
            <Chip key={tag.id} label={tag.name} onPress={() => onChange(tag.name)} />
          ))}
        <Chip label="More tags" variant="plain" onPress={() => setOpen(true)} />
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Filter by tag">
        <SearchField value={search} onChangeText={setSearch} placeholder="Search tags..." />
        <View style={{ marginTop: 8 }}>
          {list.items.map((tag) => (
            <TagRow key={tag.id} name={tag.name} count={tag.question_count} onPress={() => pick(tag.name)} style={{ paddingHorizontal: 0 }} />
          ))}
          {list.loading ? (
            <Text size={13} color={colors.muted} style={styles.note}>
              Loading tags...
            </Text>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} compact />
          ) : list.items.length === 0 ? (
            <Text size={13} color={colors.muted} style={styles.note}>
              No tags found.
            </Text>
          ) : null}
          <ViewMoreButton visible={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onPress={list.loadMore} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  note: { paddingVertical: 14 },
});