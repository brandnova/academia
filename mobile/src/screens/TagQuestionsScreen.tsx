import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/endpoints';
import type { Question, QuestionStatus } from '../api/types';
import { FilterChips } from '../components/Chips';
import { QuestionRow } from '../components/QuestionRow';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { usePagedList } from '../lib/usePagedList';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TagQuestions'>;

const FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Answered', value: 'ANSWERED' },
  { label: 'Solved', value: 'SOLVED' },
];

export function TagQuestionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { tag } = useRoute<RouteProp<RootStackParamList, 'TagQuestions'>>().params;
  const [status, setStatus] = useState('ALL');

  const list = usePagedList<Question>(
    (page, signal) => api.tags.questions(tag, { status: status === 'ALL' ? undefined : (status as QuestionStatus), page, page_size: 10, ordering: '-created_at' }, signal),
    [tag, status],
  );

  const header = (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
        <Text variant="h2">
          Questions tagged{' '}
          <Text variant="h2" color={colors.accent}>
            {tag}
          </Text>
        </Text>
      </View>
      <View style={{ paddingBottom: 10 }}>
        <FilterChips options={FILTERS} value={status} onChange={setStatus} />
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
    </View>
  );

  return (
    <Screen>
      <TopBar title={tag} onBack={() => navigation.goBack()} />

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuestionRow question={item} onPress={() => navigateRoot('Question', { questionId: item.id })} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <SkeletonQuestionList rows={6} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState icon="tag" title="No questions match" message="Try a different filter." />
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