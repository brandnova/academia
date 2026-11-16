import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { api } from '../api/endpoints';
import type { Report, ReportStatus, ReportType } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { FilterChips } from '../components/Chips';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { timeAgo } from '../lib/time';
import { usePagedList } from '../lib/usePagedList';
import { navigateRoot, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MyReports'>;

const FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reviewed', value: 'RESOLVED' },
  { label: 'No action taken', value: 'REJECTED' },
];

const TYPE_LABELS: Record<ReportType, string> = { SPAM: 'Spam', ABUSE: 'Abuse', MISINFORMATION: 'Misinformation', DUPLICATE: 'Duplicate' };

const STATUS = {
  PENDING: { label: 'Awaiting review', icon: 'clock' },
  RESOLVED: { label: 'Reviewed', icon: 'checkCircle' },
  REJECTED: { label: 'No action taken', icon: 'circleXmark' },
} as const;

export function MyReportsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();
  const { promptSignIn } = useAuthGate();
  const [filter, setFilter] = useState('ALL');

  const list = usePagedList<Report>((page, signal) => api.reports.mine({ status: filter === 'ALL' ? undefined : (filter as ReportStatus), page, page_size: 20 }, signal), [filter], { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <Screen>
        <TopBar title="My reports" onBack={() => navigation.goBack()} />
        <EmptyState icon="flag" title="Sign in to see your reports" message="Only you can see the reports you file." actionLabel="Sign in with Google" onAction={() => promptSignIn('Sign in to see your reports.')} />
      </Screen>
    );
  }

  const header = (
    <View>
      <Text size={13} color={colors.muted} style={styles.intro}>
        Only you can see this list. Reports never appear on your profile.
      </Text>
      <View style={{ paddingBottom: 12 }}>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} variant="outline" />
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
    </View>
  );

  return (
    <Screen>
      <TopBar title="My reports" onBack={() => navigation.goBack()} />

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ReportRow
            report={item}
            onView={() => {
              const target = item.link_target;
              if (target?.question_id) navigateRoot('Question', { questionId: target.question_id, answerId: target.answer_id ?? undefined });
            }}
          />
        )}
        ListEmptyComponent={
          list.loading ? (
            <SkeletonQuestionList rows={5} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState icon="flag" title="You haven't reported anything" message="If something doesn't belong here, use Report on any question, answer or comment." />
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

/** One of the reporter's own reports. Never shows who reviewed it or any escalation state. */
function ReportRow({ report, onView }: { report: Report; onView: () => void }) {
  const { colors } = useTheme();
  const status = STATUS[report.status];
  const removed = report.content_exists === false;

  return (
    <View style={[styles.row, { borderBottomColor: colors.line }]}>
      <View style={styles.rowTop}>
        <Text size={14} weight="semibold" style={{ flex: 1 }}>
          {TYPE_LABELS[report.type] ?? report.type} on a {report.content_type}
        </Text>
        <View style={styles.status}>
          <Icon name={status.icon} size={13} color={colors.muted} />
          <Text size={12} color={colors.muted}>
            {status.label}
          </Text>
        </View>
      </View>
      {report.description ? (
        <Text size={12} color={colors.muted} numberOfLines={2} style={{ marginTop: 4 }}>
          &quot;{report.description}&quot;
        </Text>
      ) : null}
      <View style={styles.meta}>
        <Text size={12} color={colors.muted}>
          Reported {timeAgo(report.created_at)}
        </Text>
        {removed ? (
          <Text size={12} color={colors.muted} style={{ fontStyle: 'italic' }}>
            Content removed
          </Text>
        ) : report.link_target?.question_id ? (
          <Pressable accessibilityRole="button" accessibilityLabel="View report content" onPress={onView} hitSlop={6}>
            <Text size={12} color={colors.accent}>
              View
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
});