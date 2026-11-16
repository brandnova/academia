import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/endpoints';
import type { Tag } from '../api/types';
import { FilterChips } from '../components/Chips';
import { Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { TagRow } from '../components/TagRow';
import { TopBar } from '../components/TopBar';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { usePagedList } from '../lib/usePagedList';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tags'>;

const ORDERS = [
  { label: 'Popular', value: 'popular' },
  { label: 'A to Z', value: 'alpha' },
];

export function TagsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('popular');
  const debounced = useDebouncedValue(search.trim(), 400);

  const list = usePagedList<Tag>(
    (page, signal) => api.tags.list({ search: debounced || undefined, popular: order === 'popular' ? true : undefined, page, page_size: 30 }, signal),
    [debounced, order],
  );

  return (
    <Screen>
      <TopBar title="Tags" onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search tags..." />
      </View>
      <View style={{ paddingBottom: 10 }}>
        <FilterChips options={ORDERS} value={order} onChange={setOrder} />
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <TagRow name={item.name} count={item.question_count} onPress={() => navigateRoot('TagQuestions', { tag: item.name })} />}
        ListEmptyComponent={
          list.loading ? (
            <SkeletonQuestionList rows={6} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState icon="tag" title="No tags found" message="Try a different search." />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onPress={list.loadMore} />}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}