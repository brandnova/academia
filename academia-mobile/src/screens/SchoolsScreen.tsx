import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, View } from 'react-native';

import { api } from '../api/endpoints';
import type { InstitutionType, Ownership, School } from '../api/types';
import { FilterChips } from '../components/Chips';
import { Input } from '../components/Form';
import { Icon } from '../components/Icon';
import { SchoolRow } from '../components/SchoolRow';
import { Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { HeaderIconButton, TopBar } from '../components/TopBar';
import { pluralize } from '../lib/time';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { usePagedList } from '../lib/usePagedList';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot } from '../navigation/types';
import { radii, useTheme } from '../theme';

const TYPES = [
  { label: 'University', value: 'UNIVERSITY' },
  { label: 'Polytechnic', value: 'POLYTECHNIC' },
  { label: 'College of Education', value: 'COLLEGE_OF_EDUCATION' },
];

const OWNERSHIPS = [
  { label: 'Federal', value: 'FEDERAL' },
  { label: 'State', value: 'STATE' },
  { label: 'Private', value: 'PRIVATE' },
];

export function SchoolsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 400);
  const [hasHub, setHasHub] = useState(false);
  const [type, setType] = useState('');
  const [ownership, setOwnership] = useState('');
  const [stateText, setStateText] = useState('');
  const debouncedState = useDebouncedValue(stateText.trim(), 500);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterCount = (hasHub ? 1 : 0) + (type ? 1 : 0) + (ownership ? 1 : 0) + (stateText.trim() ? 1 : 0);

  const list = usePagedList<School>(
    (page, signal) =>
      api.schools.list(
        {
          search: debounced || undefined,
          has_hub: hasHub || undefined,
          institution_type: (type as InstitutionType) || undefined,
          ownership: (ownership as Ownership) || undefined,
          state: debouncedState || undefined,
          page,
          page_size: 20,
        },
        signal,
      ),
    [debounced, hasHub, type, ownership, debouncedState],
  );

  useRefreshOnFocus(list.refresh);

  const clearFilters = () => {
    setHasHub(false);
    setType('');
    setOwnership('');
    setStateText('');
  };

  return (
    <Screen>
      <TopBar title="Schools" right={<HeaderIconButton icon="search" accessibilityLabel="Search" onPress={() => navigateRoot('Search')} />} />

      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search schools by name..." />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} active` : 'Filters'}
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.strong, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="sliders" size={16} color={colors.ink} />
          {filterCount > 0 ? (
            <View style={[styles.filterBadge, { backgroundColor: colors.accentSolid }]}>
              <Text size={10} weight="semibold" color="#FFFFFF">
                {filterCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Text size={12} color={colors.muted} style={styles.count}>
        {list.loading ? 'Loading...' : pluralize(list.count, 'school')}
      </Text>

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <SchoolRow school={item} onPress={() => navigateRoot('School', { schoolId: item.id })} />}
        ListEmptyComponent={
          list.loading ? (
            <SkeletonQuestionList rows={6} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState icon="building" title="No schools found" message="Try a different search or clear a filter." actionLabel={filterCount > 0 ? 'Clear filters' : undefined} onAction={filterCount > 0 ? clearFilters : undefined} />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onPress={list.loadMore} />}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      />

      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter schools"
        headerRight={
          <Pressable accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={clearFilters} hitSlop={8}>
            <Text size={12} color={colors.accent} weight="medium">
              Clear all
            </Text>
          </Pressable>
        }
      >
        <View style={[styles.switchRow, { borderBottomColor: colors.line }]}>
          <Text size={14}>Has active hub</Text>
          <Switch value={hasHub} onValueChange={setHasHub} trackColor={{ false: colors.strong, true: colors.accentSolid }} thumbColor="#FFFFFF" accessibilityLabel="Has active hub" />
        </View>

        <Text size={12} color={colors.muted} style={styles.filterLabel}>
          Institution type
        </Text>
        <FilterChips options={TYPES} value={type} onChange={setType} allowClear wrap style={styles.flush} />

        <Text size={12} color={colors.muted} style={styles.filterLabel}>
          Ownership
        </Text>
        <FilterChips options={OWNERSHIPS} value={ownership} onChange={setOwnership} allowClear wrap style={styles.flush} />

        <Input label="State" value={stateText} onChangeText={setStateText} placeholder="e.g. Oyo" autoCapitalize="words" hint="The exact state name." containerStyle={{ marginTop: 16, marginBottom: 0 }} />

        <Pressable accessibilityRole="button" accessibilityLabel="Show results" onPress={() => setFiltersOpen(false)} style={({ pressed }) => [styles.apply, { backgroundColor: colors.accentSolid, opacity: pressed ? 0.85 : 1 }]}>
          <Text size={14} weight="semibold" color="#FFFFFF" center>
            Show results
          </Text>
        </Pressable>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  filterButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  count: { paddingHorizontal: 16, paddingBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, minHeight: 52 },
  filterLabel: { marginTop: 16, marginBottom: 8 },
  flush: { paddingHorizontal: 0 },
  apply: { marginTop: 24, borderRadius: radii.lg, paddingVertical: 14, minHeight: 48, justifyContent: 'center' },
});