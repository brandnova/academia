import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconName } from '../../components/Icon';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../../components/States';
import { Tabs } from '../../components/Tabs';
import { Text } from '../../components/Text';
import { timeAgo } from '../../lib/time';
import { navigateRoot } from '../../navigation/types';
import { useTheme } from '../../theme';
import type { ProfileActivity } from './useProfileActivity';

type TabKey = 'activity' | 'questions' | 'answers' | 'comments';
interface Item { key: string; icon: IconName; text: string; createdAt: string; questionId: string }

const TABS = [
  { key: 'activity', label: 'Activity' },
  { key: 'questions', label: 'Questions' },
  { key: 'answers', label: 'Answers' },
  { key: 'comments', label: 'Comments' },
];

const EMPTY: Record<TabKey, string> = {
  activity: 'Questions, answers and comments you post will show up here.',
  questions: 'Questions you ask will show up here.',
  answers: 'Answers you post will show up here.',
  comments: 'Comments you post will show up here.',
};

/** Tab strip and list for the profile. Activity merges the newest items, the other tabs page through everything. */
export function ProfileTabs({ activity }: { activity: ProfileActivity }) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>('activity');
  const { questions, answers, comments } = activity;

  const asked = useMemo<Item[]>(() => questions.items.map((q) => ({ key: `q-${q.id}`, icon: 'messageRegular', text: `Asked: ${q.title}`, createdAt: q.created_at, questionId: q.id })), [questions.items]);
  const answered = useMemo<Item[]>(
    () => answers.items.filter((a) => a.question?.id).map((a) => ({ key: `a-${a.id}`, icon: 'arrowUp', text: `Answered: ${a.question?.title ?? 'a question'}`, createdAt: a.created_at, questionId: a.question?.id ?? '' })),
    [answers.items],
  );
  const commented = useMemo<Item[]>(
    () => comments.items.filter((c) => c.answer?.question?.id).map((c) => ({ key: `c-${c.id}`, icon: 'comment', text: `Commented on: ${c.answer.question?.title ?? 'a question'}`, createdAt: c.created_at, questionId: c.answer.question?.id ?? '' })),
    [comments.items],
  );

  const source = tab === 'questions' ? questions : tab === 'answers' ? answers : tab === 'comments' ? comments : null;
  const items = tab === 'questions' ? asked : tab === 'answers' ? answered : tab === 'comments' ? commented : [...asked, ...answered, ...commented].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
  const loading = source ? source.loading : questions.loading || answers.loading || comments.loading;
  const error = source ? source.error : questions.error ?? answers.error ?? comments.error;
  const retry = () => (source ? source.retry() : (questions.retry(), answers.retry(), comments.retry()));

  return (
    <View>
      <Tabs tabs={TABS} value={tab} onChange={(key) => setTab(key as TabKey)} />

      {loading ? (
        <SkeletonQuestionList rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : items.length === 0 ? (
        <EmptyState icon="messageRegular" title={tab === 'activity' ? 'No activity yet' : 'Nothing here yet'} message={EMPTY[tab]} />
      ) : (
        <View style={[styles.list, { borderColor: colors.line }]}>
          {items.map((item) => (
            <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={item.text} onPress={() => navigateRoot('Question', { questionId: item.questionId })} style={({ pressed }) => [styles.item, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
              <Icon name={item.icon} size={14} color={colors.accent} />
              <Text size={14} numberOfLines={1} style={{ flex: 1 }}>
                {item.text}
              </Text>
              <Text size={11} color={colors.muted}>
                {timeAgo(item.createdAt)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {source ? <ViewMoreButton visible={source.hasMore} loading={source.loadingMore} error={source.loadMoreError} onPress={source.loadMore} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 48 },
});