import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ApiError } from '../api/client';
import { api } from '../api/endpoints';
import type { Paginated, SearchQuestion } from '../api/types';
import { QuestionRow } from '../components/QuestionRow';
import { Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { TagFilter } from '../features/tags/TagFilter';
import { pluralize } from '../lib/time';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { usePagedList } from '../lib/usePagedList';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export type SearchRow = SearchQuestion & { answer_count?: number; department?: { id: string; name: string } | null };

export function SearchScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const debounced = useDebouncedValue(query.trim(), 500);
  const pending = query.trim() !== debounced;

  const searchPage = useCallback(
    async (page: number, signal: AbortSignal): Promise<Paginated<SearchRow>> => {
      try {
        return (await api.search.questions({ q: debounced || undefined, tag: tag || undefined, page, page_size: 10 }, signal)) as Paginated<SearchRow>;
      } catch (error) {
        // Ranked search needs Postgres full text search. Development builds on a SQLite backend fall back to the
        // plain question filter, release builds never do, so a real outage is not hidden.
        if (__DEV__ && error instanceof ApiError && error.status >= 500) {
          const fallback = await api.questions.list({ search: debounced || undefined, tag: tag || undefined, page, page_size: 10, ordering: '-created_at' }, signal);
          return { ...fallback, results: fallback.results.map((question) => ({ ...question, score: null })) };
        }
        throw error;
      }
    },
    [debounced, tag],
  );

  const results = usePagedList<SearchRow>(searchPage, [debounced, tag]);

  const header = (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search questions..." autoFocus returnKeyType="search" />
      </View>

      <TagFilter value={tag} onChange={setTag} />

      <View style={styles.countRow}>
        <Text size={12} color={colors.muted}>
          {pending || results.loading ? 'Searching...' : `${pluralize(results.count, 'result')}${debounced ? '' : ' · sorted by relevance and activity'}`}
        </Text>
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
    </View>
  );

  return (
    <Screen>
      <TopBar title="Search" onBack={() => navigation.goBack()} />

      <FlatList
        data={results.items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <QuestionRow question={item} showDepartment={Boolean(item.department)} onPress={() => navigateRoot('Question', { questionId: item.id })} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          results.loading ? (
            <SkeletonQuestionList rows={6} />
          ) : results.error ? (
            <ErrorState error={results.error} onRetry={results.retry} />
          ) : (
            <EmptyState icon="search" title="No questions match" message="Try a different search or clear a filter." />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={results.hasMore} loading={results.loadingMore} error={results.loadMoreError} onPress={results.loadMore} />}
        refreshControl={<RefreshControl refreshing={results.refreshing} onRefresh={results.refresh} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  countRow: { paddingHorizontal: 16, paddingBottom: 8 },
});