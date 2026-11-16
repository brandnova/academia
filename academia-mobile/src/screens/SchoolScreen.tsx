import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ApiError } from '../api/client';
import { api } from '../api/endpoints';
import type { Hub, Question, QuestionFilters, School } from '../api/types';
import { FilterChips } from '../components/Chips';
import { Icon } from '../components/Icon';
import { QuestionRow } from '../components/QuestionRow';
import { Screen } from '../components/Screen';
import { ActionSheet } from '../components/Sheet';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { RequestHubSheet } from '../features/schools/RequestHubSheet';
import { SchoolHero } from '../features/schools/SchoolHero';
import { pluralize } from '../lib/time';
import { usePagedList } from '../lib/usePagedList';
import { useQuery } from '../lib/useQuery';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'School'>;
type Ordering = NonNullable<QuestionFilters['ordering']>;

const STATUS = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Answered', value: 'ANSWERED' },
  { label: 'Solved', value: 'SOLVED' },
];

const SORTS: { label: string; value: Ordering }[] = [
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
  { label: 'Most viewed', value: '-views' },
  { label: 'Least viewed', value: 'views' },
];

export function SchoolScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { schoolId, slug } = useRoute<RouteProp<RootStackParamList, 'School'>>().params ?? {};
  const { requireAuth } = useAuthGate();

  const [status, setStatus] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('');
  const [ordering, setOrdering] = useState<Ordering>('-created_at');
  const [sortOpen, setSortOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const schoolQuery = useQuery<School>((signal) => (schoolId ? api.schools.get(schoolId, signal) : api.schools.bySlug(slug ?? '', signal)), [schoolId, slug], { enabled: Boolean(schoolId || slug) });
  const school = schoolQuery.data;

  const hubQuery = useQuery<Hub | null>(
    async (signal) => {
      if (!school?.id) return null;
      try {
        return await api.hubs.bySchool(school.id, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    [school?.id],
    { enabled: Boolean(school?.id) },
  );

  const rawHub = hubQuery.data;
  const hub = rawHub && rawHub.is_active !== false ? rawHub : null;

  const questions = usePagedList<Question>(
    (page, signal) => api.questions.list({ hub: hub?.id, status: status === 'ALL' ? undefined : (status as Question['status']), department: departmentId || undefined, page, page_size: 10, ordering }, signal),
    [hub?.id, status, departmentId, ordering],
    { enabled: Boolean(hub?.id) },
  );

  const refreshAll = useCallback(() => {
    schoolQuery.refetch();
    hubQuery.refetch();
    if (hub?.id) questions.refresh();
  }, [schoolQuery, hubQuery, questions, hub?.id]);

  useRefreshOnFocus(refreshAll);

  const departmentOptions = useMemo(() => [{ label: 'All departments', value: '' }, ...(hub?.departments ?? []).map((item) => ({ label: item.name, value: item.id }))], [hub?.departments]);
  const sortLabel = SORTS.find((item) => item.value === ordering)?.label ?? 'Newest';

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigateRoot('Main', { screen: 'Schools' }));

  if (!schoolId && !slug) {
    return (
      <Screen>
        <TopBar title="School" onBack={back} />
        <ErrorState error={new Error('No school was provided.')} onRetry={back} />
      </Screen>
    );
  }

  if (schoolQuery.loading && !school) {
    return (
      <Screen>
        <TopBar title="School" onBack={back} />
        <SkeletonQuestionList rows={6} />
      </Screen>
    );
  }

  if (!school || schoolQuery.error) {
    return (
      <Screen>
        <TopBar title="School" onBack={back} />
        <ErrorState error={schoolQuery.error ?? new Error('School not found')} onRetry={schoolQuery.refetch} />
      </Screen>
    );
  }

  const header = (
    <View>
      <SchoolHero school={school} hub={hub} />
      {hub ? (
        <View style={{ paddingTop: 12, gap: 8 }}>
          <FilterChips options={STATUS} value={status} onChange={setStatus} />
          {hub.departments.length > 0 ? <FilterChips options={departmentOptions} value={departmentId} onChange={setDepartmentId} variant="outline" /> : null}
          <View style={styles.sortRow}>
            <Text size={12} color={colors.muted}>
              {pluralize(questions.count, 'question')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Sort: ${sortLabel}`} onPress={() => setSortOpen(true)} hitSlop={8} style={styles.sort}>
              <Text size={12} weight="medium" color={colors.accent}>
                Sort: {sortLabel}
              </Text>
              <Icon name="chevronDown" size={9} color={colors.accent} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <TopBar title={school.short_name || 'School'} onBack={back} />

      <FlatList
        data={hub ? questions.items : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuestionRow question={item} showSchool={false} onPress={() => navigateRoot('Question', { questionId: item.id })} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          hubQuery.loading && !rawHub ? (
            <SkeletonQuestionList rows={4} />
          ) : hubQuery.error ? (
            <ErrorState error={hubQuery.error} onRetry={hubQuery.refetch} compact />
          ) : !hub ? (
            <View style={[styles.noHub, { borderColor: colors.line }]}>
              <Text size={14} weight="semibold" center>
                {school.name} has no active hub yet.
              </Text>
              <Text size={14} color={colors.muted} center style={{ marginTop: 4, marginBottom: 16 }}>
                Be the first to request one.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Request hub activation"
                onPress={() => requireAuth(() => setRequestOpen(true), 'Sign in to request a hub.')}
                style={({ pressed }) => [styles.requestButton, { backgroundColor: colors.accentSolid, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text size={14} weight="semibold" color="#FFFFFF" center>
                  Request hub activation
                </Text>
              </Pressable>
            </View>
          ) : questions.loading ? (
            <SkeletonQuestionList rows={5} />
          ) : questions.error ? (
            <ErrorState error={questions.error} onRetry={questions.retry} />
          ) : (
            <EmptyState icon="messageRegular" title="No questions match" message="Try a different filter or ask the first question." />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={Boolean(hub) && questions.hasMore} loading={questions.loadingMore} error={questions.loadMoreError} onPress={questions.loadMore} />}
        refreshControl={<RefreshControl refreshing={questions.refreshing || schoolQuery.refreshing} onRefresh={refreshAll} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      <ActionSheet visible={sortOpen} onClose={() => setSortOpen(false)} label="Sort questions" actions={SORTS.map((item) => ({ label: item.label, icon: item.value === ordering ? 'check' : undefined, onPress: () => setOrdering(item.value) }))} />
      <RequestHubSheet school={school} visible={requestOpen} onClose={() => setRequestOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4 },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  noHub: { margin: 16, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center' },
  requestButton: { borderRadius: 8, paddingVertical: 11, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' },
});