import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/endpoints';
import type { AppNotification } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { useUnread } from '../auth/UnreadProvider';
import { FilterChips } from '../components/Chips';
import { Icon, IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { EmptyState, ErrorState, SkeletonQuestionList, ViewMoreButton } from '../components/States';
import { Text } from '../components/Text';
import { HeaderTextButton, TopBar } from '../components/TopBar';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { useAdminNotificationWeb } from '../features/staff/notifications';
import { timeAgo } from '../lib/time';
import { usePagedList } from '../lib/usePagedList';
import { useRefreshOnFocus } from '../lib/useRefreshOnFocus';
import { navigateRoot } from '../navigation/types';
import { useTheme } from '../theme';

const ICONS: Record<string, IconName> = {
  NEW_ANSWER: 'messageRegular',
  BEST_ANSWER: 'award',
  HUB_ACTIVATED: 'checkCircle',
  NEW_COMMENT: 'comment',
  VOTE: 'thumbsUpRegular',
  MODERATOR_ASSIGNED: 'shield',
  NEW_QUESTION: 'question',
  NEW_ACTIVATION_REQUEST: 'building',
  NEW_REPORT: 'flag',
  USER_SUSPENDED: 'ban',
  HUB_ACTIVATION_REJECTED: 'circleXmark',
  REPORT_REVIEWED: 'clipboardCheck',
};

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
];

export function NotificationsScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { unreadCount, refresh: refreshUnread, setUnreadCount } = useUnread();
  const { promptSignIn } = useAuthGate();
  const [filter, setFilter] = useState('all');

  const list = usePagedList<AppNotification>((page, signal) => api.notifications.list({ is_read: filter === 'unread' ? false : undefined, page, page_size: 20 }, signal), [filter, user?.id], { enabled: isAuthenticated });

  useRefreshOnFocus(list.refresh);
  useFocusEffect(
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  const markAll = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      list.setItems((current) => (filter === 'unread' ? [] : current.map((item) => ({ ...item, is_read: true }))));
    } catch {
      // The next refresh corrects the badge.
    }
  };

  const openNotification = async (notification: AppNotification, webOnly = false) => {
    if (!notification.is_read) {
      setUnreadCount(Math.max(0, unreadCount - 1));
      list.setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)));
      try {
        await api.notifications.markRead(notification.id);
      } catch {
        // Navigation is still useful if the read receipt fails.
      }
    }

    const target = notification.link_target;
    if (!webOnly && target?.question_id) navigateRoot('Question', { questionId: target.question_id, answerId: target.answer_id ?? undefined });
  };

  if (!isAuthenticated) {
    return (
      <Screen>
        <TopBar title="Notifications" />
        <EmptyState icon="bell" title="Sign in to see your notifications" message="Answers, comments and moderation updates will show up here." actionLabel="Sign in with Google" onAction={() => promptSignIn('Sign in to see your notifications.')} />
      </Screen>
    );
  }

  const header = (
    <View>
      <View style={{ paddingVertical: 10 }}>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} variant="outline" />
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
    </View>
  );

  return (
    <Screen>
      <TopBar title="Notifications" right={unreadCount > 0 ? <HeaderTextButton label="Mark all read" onPress={markAll} /> : undefined} />

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow notification={item} onPress={(webOnly) => openNotification(item, webOnly)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <SkeletonQuestionList rows={6} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState icon="bell" title="You are all caught up" message="New activity will show up here." />
          )
        }
        ListFooterComponent={<ViewMoreButton visible={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onPress={list.loadMore} />}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={() => { list.refresh(); void refreshUnread(); }} tintColor={colors.accent} colors={[colors.accent]} />}
        contentContainerStyle={{ paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: (webOnly: boolean) => void }) {
  const { colors } = useTheme();
  const webAction = useAdminNotificationWeb(notification.type, () => onPress(true));
  const unread = !notification.is_read;
  const hasLink = Boolean(notification.link_target?.question_id);
  const unreadBg = colors.isDark ? 'rgba(52, 84, 209, 0.12)' : 'rgba(52, 84, 209, 0.05)';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${notification.message}`}
      onPress={() => (webAction ? webAction() : onPress(false))}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.line, backgroundColor: unread ? unreadBg : pressed ? colors.subtle : 'transparent' }]}
    >
      <View style={styles.iconColumn}>
        <Icon name={ICONS[notification.type] ?? 'bell'} size={16} color={unread ? colors.accent : colors.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text size={13} weight={unread ? 'semibold' : 'regular'} style={{ lineHeight: 19 }}>
          {notification.message}
        </Text>
        <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
          {timeAgo(notification.created_at)}
        </Text>
        {webAction ? (
          <Text size={12} weight="semibold" color={colors.accent} style={{ marginTop: 6 }}>
            Open on web
          </Text>
        ) : null}
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: colors.accentSolid }]} /> : null}
      {hasLink && !webAction ? <Icon name="chevronRight" size={12} color={colors.muted} style={{ marginTop: 4 }} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconColumn: { width: 18, alignItems: 'center', paddingTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginLeft: 2 },
});