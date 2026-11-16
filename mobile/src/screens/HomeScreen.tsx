import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { api } from '../api/endpoints';
import type { Question } from '../api/types';
import { Chip } from '../components/Chips';
import { QuestionRow } from '../components/QuestionRow';
import { Screen } from '../components/Screen';
import { SearchPill } from '../components/SearchField';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { HeaderIconButton, SectionHeader, TopBar } from '../components/TopBar';
import { SCHOOL_CARD_HEIGHT, SCHOOL_CARD_WIDTH, SchoolCard } from '../features/schools/SchoolCard';
import { usePagedList } from '../lib/usePagedList';
import { useQuery } from '../lib/useQuery';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot, TabParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = BottomTabNavigationProp<TabParamList, 'Home'>;

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const [tick, setTick] = useState(0);

  const questions = usePagedList<Question>((page, signal) => api.questions.list({ page, page_size: 10, ordering: '-created_at' }, signal), []);
  const schools = useQuery((signal) => api.schools.list({ has_hub: true, page_size: 5 }, signal), []);
  const tags = useQuery((signal) => api.tags.list({ popular: true, page_size: 8 }, signal), []);

  const refreshAll = useCallback(() => {
    questions.refresh();
    schools.refetch();
    tags.refetch();
    setTick((value) => value + 1);
  }, [questions, schools, tags]);

  useRefreshOnFocus(refreshAll);

  const schoolList = schools.data?.results ?? [];
  const tagList = (tags.data?.results ?? []).slice(0, 6);

  const header = (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}>
        <SearchPill label="Search questions across all schools..." onPress={() => navigateRoot('Search')} />
      </View>

      {schools.loading || schools.error || schoolList.length > 0 ? (
        <>
          <SectionHeader title="Schools with hubs" actionLabel="View all" onAction={() => navigation.navigate('Schools')} />
          {schools.loading ? (
            <View style={styles.strip}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={[styles.cardSkeleton, { backgroundColor: colors.skeleton }]} />
              ))}
            </View>
          ) : schools.error ? (
            <ErrorState error={schools.error} onRetry={schools.refetch} compact />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
              {schoolList.map((school) => (
                <SchoolCard key={school.id} school={school} refreshKey={tick} onPress={() => navigateRoot('School', { schoolId: school.id })} />
              ))}
            </ScrollView>
          )}
        </>
      ) : null}

      <SectionHeader title="Popular tags" actionLabel="View all" onAction={() => navigateRoot('Tags')} style={{ marginTop: 20 }} />
      {tags.loading ? (
        <View style={styles.strip}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={[styles.tagSkeleton, { backgroundColor: colors.skeleton }]} />
          ))}
        </View>
      ) : tags.error ? (
        <ErrorState error={tags.error} onRetry={tags.refetch} compact />
      ) : (
        <View style={styles.tags}>
          {tagList.map((tag) => (
            <Chip key={tag.id} label={tag.name} variant="plain" accessibilityLabel={`Tag ${tag.name}`} onPress={() => navigateRoot('TagQuestions', { tag: tag.name })} />
          ))}
        </View>
      )}

      <View style={[styles.recentLabel, { borderTopColor: colors.line }]}>
        <Text variant="label" color={colors.muted}>
          Recent questions
        </Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <TopBar wordmark right={<HeaderIconButton icon="search" accessibilityLabel="Search" onPress={() => navigateRoot('Search')} />} />

      <FlatList
        data={questions.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuestionRow question={item} onPress={() => navigateRoot('Question', { questionId: item.id })} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          questions.loading ? (
            <SkeletonQuestionList rows={5} />
          ) : questions.error ? (
            <ErrorState error={questions.error} onRetry={questions.retry} />
          ) : (
            <EmptyState icon="messageRegular" title="No questions yet" message="Be the first to ask one." />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={questions.hasMore} loading={questions.loadingMore} error={questions.loadMoreError} onPress={questions.loadMore} />}
        refreshControl={<RefreshControl refreshing={questions.refreshing || schools.refreshing || tags.refreshing} onRefresh={refreshAll} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  cardSkeleton: { width: SCHOOL_CARD_WIDTH, height: SCHOOL_CARD_HEIGHT, borderRadius: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  tagSkeleton: { width: 72, height: 32, borderRadius: 8 },
  recentLabel: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 20 },
});